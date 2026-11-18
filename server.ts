import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { exec, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// List all python files recursively in a directory
function getPythonFiles(dir: string, baseDir: string = dir): { path: string; name: string; relativePath: string; content: string; lines: number }[] {
  let results: { path: string; name: string; relativePath: string; content: string; lines: number }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__pycache__' && entry.name !== '.git' && entry.name !== 'node_modules') {
        results = results.concat(getPythonFiles(fullPath, baseDir));
      }
    } else if (entry.isFile() && entry.name.endsWith('.py')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      results.push({
        path: fullPath,
        name: entry.name,
        relativePath: path.relative(baseDir, fullPath),
        content,
        lines,
      });
    }
  }
  return results;
}

// 1. Python Environment Status
app.get('/api/python/status', (req: Request, res: Response) => {
  exec('python3 --version', (err, stdout) => {
    const pythonVersion = err ? 'Unavailable' : stdout.trim();
    const pythonFiles = [
      ...getPythonFiles(path.resolve(__dirname, 'krunker_recreation'), path.resolve(__dirname)),
      ...getPythonFiles(path.resolve(__dirname), path.resolve(__dirname)).filter(f => f.name === 'run_krunker.py' || f.name === 'setup.py'),
    ];
    const totalLines = pythonFiles.reduce((acc, f) => acc + f.lines, 0);

    res.json({
      status: 'active',
      pythonVersion,
      totalFiles: pythonFiles.length,
      totalLines,
      framework: 'Panda3D 3D Desktop + Custom Physics Engine',
      environment: process.platform,
    });
  });
});

// 2. Run Python Unit Tests
app.post('/api/python/run-tests', (req: Request, res: Response) => {
  const startTime = Date.now();
  exec('python3 -m unittest discover -s krunker_recreation/tests -v', { cwd: __dirname }, (error, stdout, stderr) => {
    const durationMs = Date.now() - startTime;
    const combinedOutput = (stdout + '\n' + stderr).trim();
    const success = !error;
    res.json({
      success,
      output: combinedOutput,
      durationMs,
      exitCode: error ? error.code : 0,
    });
  });
});

// 3. Get All Python Source Modules
app.get('/api/python/files', (req: Request, res: Response) => {
  const recreationFiles = getPythonFiles(path.resolve(__dirname, 'krunker_recreation'), path.resolve(__dirname));
  const rootFiles = [
    path.resolve(__dirname, 'run_krunker.py'),
    path.resolve(__dirname, 'setup.py'),
  ].filter(p => fs.existsSync(p)).map(p => {
    const content = fs.readFileSync(p, 'utf8');
    return {
      path: p,
      name: path.basename(p),
      relativePath: path.basename(p),
      content,
      lines: content.split('\n').length,
    };
  });

  res.json({
    files: [...rootFiles, ...recreationFiles],
  });
});

// 4. Run Physics Benchmark
app.post('/api/python/benchmark', (req: Request, res: Response) => {
  exec('python3 run_krunker.py --benchmark', { cwd: __dirname }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      output: (stdout + '\n' + stderr).trim(),
    });
  });
});

// 5. Run Headless Match Simulation
app.post('/api/python/simulate-match', (req: Request, res: Response) => {
  const bots = Math.min(8, Math.max(1, Number(req.body.bots) || 2));
  const diff = ['easy', 'normal', 'hard', 'pro'].includes(req.body.difficulty) ? req.body.difficulty : 'normal';
  const mode = ['ffa', 'tdm', 'hardpoint'].includes(req.body.mode) ? req.body.mode : 'ffa';

  exec(`python3 run_krunker.py --headless --bots ${bots} --difficulty ${diff} --mode ${mode}`, { cwd: __dirname }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      output: (stdout + '\n' + stderr).trim(),
    });
  });
});

// 6. Save Python Configuration
app.post('/api/python/save-config', (req: Request, res: Response) => {
  const { relativePath, content } = req.body;
  if (!relativePath || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing relativePath or content' });
  }

  // Sanitize path to ensure it is inside the project
  const targetPath = path.resolve(__dirname, relativePath);
  if (!targetPath.startsWith(path.resolve(__dirname, 'krunker_recreation/config'))) {
    return res.status(403).json({ error: 'Only files in krunker_recreation/config/ can be edited via this endpoint' });
  }

  // Backup original content
  const original = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : null;

  try {
    fs.writeFileSync(targetPath, content, 'utf8');
    // Verify syntax using py_compile
    exec(`python3 -m py_compile "${targetPath}"`, (compileErr, stdout, stderr) => {
      if (compileErr) {
        // Revert on syntax error
        if (original !== null) fs.writeFileSync(targetPath, original, 'utf8');
        return res.status(400).json({
          error: 'Python syntax error detected. Changes were safely reverted.',
          details: (stdout + '\n' + stderr).trim(),
        });
      }
      res.json({ success: true, message: `Successfully updated ${path.basename(targetPath)}` });
    });
  } catch (err: any) {
    if (original !== null) fs.writeFileSync(targetPath, original, 'utf8');
    res.status(500).json({ error: err.message });
  }
});

// 7. Persistent SQLite3 + JSON Storage Engine (krunker_recreation/saves/krunker_arena.db & JSON mirror)
const CAMPAIGN_SAVE_FILE = path.resolve(__dirname, 'krunker_recreation/saves/campaign_progress.json');
const FULL_STATE_FILE = path.resolve(__dirname, 'krunker_recreation/saves/full_game_state.json');
const DB_SCRIPT_PATH = path.resolve(__dirname, 'krunker_recreation/core/database.py');

function runPythonDbCommand(cmd: string, payload?: any): any | null {
  try {
    const inputStr = payload ? JSON.stringify(payload) : '';
    const proc = spawnSync('python3', [DB_SCRIPT_PATH, cmd], {
      cwd: __dirname,
      input: inputStr,
      encoding: 'utf8',
      timeout: 4000,
    });
    if (proc.status === 0 && proc.stdout) {
      return JSON.parse(proc.stdout.trim());
    }
  } catch {
    // Fallback to JSON mirror if python3 subprocess fails
  }
  return null;
}

function readCampaignSave() {
  const sqlRes = runPythonDbCommand('get_campaign');
  if (sqlRes && typeof sqlRes.unlocked_level === 'number') {
    return sqlRes;
  }
  const defaultSave = {
    unlocked_level: 1,
    total_xp: 0,
    total_coins: 0,
    unlocked_weapons: ['assault_rifle', 'sniper_rifle', 'smg'],
    unlocked_cosmetics: ['tactical'],
    completed_levels: {} as Record<string, any>,
  };
  try {
    if (fs.existsSync(CAMPAIGN_SAVE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CAMPAIGN_SAVE_FILE, 'utf8'));
      return { ...defaultSave, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultSave;
}

function writeCampaignSave(data: any) {
  fs.mkdirSync(path.dirname(CAMPAIGN_SAVE_FILE), { recursive: true });
  fs.writeFileSync(CAMPAIGN_SAVE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readFullStateSave() {
  const sqlRes = runPythonDbCommand('get_state');
  if (sqlRes && sqlRes.userStats) {
    return sqlRes;
  }
  const defaultFull = {
    userStats: {
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      totalKills: 0,
      totalDeaths: 0,
      headshots: 0,
      shotsFired: 0,
      shotsHit: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      unlockedSkins: ['tactical', 'cyber', 'gold', 'camo', 'hyperbeast'],
    },
    preferences: {
      currentClass: 'triggerman',
      selectedMap: 'urban',
      selectedMode: 'ffa',
      botDifficulty: 'normal',
      botCount: 4,
      settings: {},
    },
    campaignProgress: readCampaignSave(),
    matchHistory: [] as any[],
  };
  try {
    if (fs.existsSync(FULL_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FULL_STATE_FILE, 'utf8'));
      return { ...defaultFull, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultFull;
}

function writeFullStateSave(payload: any) {
  const sqlRes = runPythonDbCommand('save_state', payload);
  const nextState = sqlRes || {
    ...readFullStateSave(),
    ...(payload.userStats ? { userStats: payload.userStats } : {}),
    ...(payload.preferences ? { preferences: payload.preferences } : {}),
  };
  fs.mkdirSync(path.dirname(FULL_STATE_FILE), { recursive: true });
  fs.writeFileSync(FULL_STATE_FILE, JSON.stringify(nextState, null, 2), 'utf8');
  return nextState;
}

app.get('/api/storage/state', (_req: Request, res: Response) => {
  res.json(readFullStateSave());
});

app.post('/api/storage/state', (req: Request, res: Response) => {
  const updated = writeFullStateSave(req.body || {});
  res.json(updated);
});

app.get('/api/campaign/progress', (_req: Request, res: Response) => {
  res.json(readCampaignSave());
});

app.post('/api/campaign/complete', (req: Request, res: Response) => {
  const { levelNumber, stars, score, timeSec, xpEarned, coinsEarned, weaponUnlock, cosmeticReward } = req.body;
  const lvl = Math.max(1, Math.min(15, Number(levelNumber) || 1));

  // Persist into SQLite3 database first
  const sqlState = runPythonDbCommand('complete_campaign', {
    levelNumber: lvl,
    stars,
    score,
    timeSec,
    xpEarned,
    coinsEarned,
    weaponUnlock,
    cosmeticReward,
  });

  if (sqlState && typeof sqlState.unlocked_level === 'number') {
    writeCampaignSave(sqlState);
    return res.json(sqlState);
  }

  const state = readCampaignSave();
  const key = String(lvl);
  const prev = state.completed_levels[key] || {};

  state.completed_levels[key] = {
    level_number: lvl,
    stars: Math.max(Number(prev.stars || 0), Math.min(3, Math.max(1, Number(stars) || 1))),
    best_score: Math.max(Number(prev.best_score || 0), Number(score) || 0),
    best_time_sec: prev.best_time_sec ? Math.min(Number(prev.best_time_sec), Number(timeSec) || 999) : Number(timeSec) || 60,
    times_completed: Number(prev.times_completed || 0) + 1,
  };

  if (lvl >= Number(state.unlocked_level || 1) && lvl < 15) {
    state.unlocked_level = lvl + 1;
  }

  state.total_xp = Number(state.total_xp || 0) + (Number(xpEarned) || 0);
  state.total_coins = Number(state.total_coins || 0) + (Number(coinsEarned) || 0);

  if (weaponUnlock && !state.unlocked_weapons.includes(weaponUnlock)) {
    state.unlocked_weapons.push(weaponUnlock);
  }
  if (cosmeticReward && !state.unlocked_cosmetics.includes(cosmeticReward)) {
    state.unlocked_cosmetics.push(cosmeticReward);
  }

  writeCampaignSave(state);
  res.json(state);
});

app.post('/api/campaign/reset', (_req: Request, res: Response) => {
  const fresh = {
    unlocked_level: 1,
    total_xp: 0,
    total_coins: 0,
    unlocked_weapons: ['assault_rifle', 'sniper_rifle', 'smg'],
    unlocked_cosmetics: ['tactical'],
    completed_levels: {},
  };
  writeCampaignSave(fresh);
  res.json(fresh);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Python Framework Bridge] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
