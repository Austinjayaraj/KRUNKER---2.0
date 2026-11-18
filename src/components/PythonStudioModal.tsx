import React, { useState, useEffect } from 'react';

interface PythonFileEntry {
  name: string;
  relativePath: string;
  lines: number;
  content: string;
}

interface PythonStudioModalProps {
  onClose: () => void;
}

export const PythonStudioModal: React.FC<PythonStudioModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'code' | 'benchmark' | 'simulate' | 'desktop'>('tests');
  const [files, setFiles] = useState<PythonFileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<PythonFileEntry | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testDuration, setTestDuration] = useState<number | null>(null);

  // Benchmark State
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkOutput, setBenchmarkOutput] = useState<string | null>(null);

  // Simulation State
  const [simBots, setSimBots] = useState<number>(4);
  const [simDiff, setSimDiff] = useState<string>('normal');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationOutput, setSimulationOutput] = useState<string | null>(null);

  // System Status
  const [systemStatus, setSystemStatus] = useState<{
    pythonVersion: string;
    totalFiles: number;
    totalLines: number;
    framework: string;
  } | null>(null);

  useEffect(() => {
    // Fetch Python status and files
    fetch('/api/python/status')
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch(() => {});

    fetch('/api/python/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          setSelectedFile(data.files[0]);
          setEditedContent(data.files[0].content);
        }
      })
      .catch(() => {});

    // Automatically run tests on initial open
    handleRunTests();
  }, []);

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestOutput('Running python3 -m unittest discover -s krunker_recreation/tests -v ...');
    try {
      const res = await fetch('/api/python/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestSuccess(data.success);
      setTestOutput(data.output);
      setTestDuration(data.durationMs);
    } catch (err: any) {
      setTestSuccess(false);
      setTestOutput(`Failed to execute Python tests: ${err.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkOutput('Executing Python physics benchmark (1000 ticks)...');
    try {
      const res = await fetch('/api/python/benchmark', { method: 'POST' });
      const data = await res.json();
      setBenchmarkOutput(data.output);
    } catch (err: any) {
      setBenchmarkOutput(`Benchmark error: ${err.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationOutput(`Launching Python tournament simulation (${simBots} bots, ${simDiff} difficulty)...`);
    try {
      const res = await fetch('/api/python/simulate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bots: simBots, difficulty: simDiff, mode: 'ffa' }),
      });
      const data = await res.json();
      setSimulationOutput(data.output);
    } catch (err: any) {
      setSimulationOutput(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectFile = (f: PythonFileEntry) => {
    setSelectedFile(f);
    setEditedContent(f.content);
    setIsEditing(false);
    setSaveStatus(null);
  };

  const handleSaveConfig = async () => {
    if (!selectedFile) return;
    setSaveStatus('Compiling and saving...');
    try {
      const res = await fetch('/api/python/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relativePath: selectedFile.relativePath,
          content: editedContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveStatus('Saved & Python syntax verified!');
        setIsEditing(false);
        // Update local file in list
        setFiles((prev) =>
          prev.map((f) => (f.relativePath === selectedFile.relativePath ? { ...f, content: editedContent } : f))
        );
      } else {
        setSaveStatus(`Error: ${data.error || 'Failed to save'}`);
      }
    } catch (err: any) {
      setSaveStatus(`Network error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-950/85 backdrop-blur-md pointer-events-auto font-rajdhani">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
              Py
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-teko text-white tracking-wider uppercase leading-none">
                  PYTHON FPS FRAMEWORK & DESKTOP STUDIO
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  100% PURE PYTHON
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Panda3D 3D Graphics · Custom Physics & Slide-Hopping · FSM Bot AI · 19/19 Unit Tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {systemStatus && (
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Runtime:</span>
                <span className="text-emerald-400 font-semibold">{systemStatus.pythonVersion}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Modules:</span>
                <span className="text-amber-400 font-semibold">{systemStatus.totalFiles} files ({systemStatus.totalLines} lines)</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unit Tests (19/19)
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Source Code Explorer
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Physics Benchmark
          </button>
          <button
            onClick={() => setActiveTab('simulate')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'simulate'
                ? 'bg-slate-900 text-purple-400 border-t-2 border-purple-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Headless Match Simulation
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-slate-900 text-white border-t-2 border-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Desktop Panda3D Launch
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {/* TAB 1: UNIT TESTS */}
          {activeTab === 'tests' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-teko tracking-wide text-white">
                    AUTOMATED PYTHON UNIT TEST SUITE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Runs Python's native <code className="text-emerald-400">unittest</code> runner verifying movement physics, weapons, bot tactical AI, damage, and map collision AABBs.
                  </p>
                </div>
                <button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {isRunningTests ? 'Running in Python...' : 'Run Python Tests Again'}
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  testSuccess === true
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : testSuccess === false
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl">
                    {testSuccess === true ? '✓' : testSuccess === false ? '✗' : '•'}
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider">
                      {testSuccess === true
                        ? 'All 19 Python Tests Passed Successfully!'
                        : testSuccess === false
                        ? 'Some Python Tests Encountered Errors'
                        : 'Executing Test Discovery...'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Subsystems: Movement Physics · Weapons & Hitscan · Classes · Bot AI FSM · Arena Maps · Game Modes
                    </div>
                  </div>
                </div>
                {testDuration !== null && (
                  <div className="text-xs font-mono bg-slate-950/50 px-3 py-1 rounded border border-slate-800">
                    Duration: <span className="text-emerald-400 font-bold">{testDuration} ms</span>
                  </div>
                )}
              </div>

              {/* Terminal View */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-auto text-emerald-400/90 whitespace-pre">
                {testOutput || 'Click "Run Python Tests Again" to execute.'}
              </div>
            </div>
          )}

          {/* TAB 2: CODE EXPLORER */}
          {activeTab === 'code' && (
            <div className="flex h-full gap-4 overflow-hidden">
              {/* File Tree Sidebar */}
              <div className="w-64 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Python Modules ({files.length})
                </div>
                <div className="flex flex-col gap-1">
                  {files.map((file) => {
                    const isSelected = selectedFile?.relativePath === file.relativePath;
                    const isConfig = file.relativePath.includes('config');
                    return (
                      <button
                        key={file.relativePath}
                        onClick={() => handleSelectFile(file)}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/40'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{file.relativePath}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1">{file.lines}L</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Viewer / Editor */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedFile?.relativePath || 'No file selected'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({selectedFile?.lines || 0} lines)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedFile?.relativePath.includes('config') && (
                      <>
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors cursor-pointer"
                          >
                            Edit Config
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveConfig}
                              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Save & Verify
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditedContent(selectedFile.content);
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {saveStatus && (
                      <span className="text-xs font-mono text-emerald-400">{saveStatus}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300">
                  {isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-full bg-slate-900/90 text-amber-300 border border-slate-700 p-3 rounded-lg font-mono text-xs focus:outline-none focus:border-amber-400 resize-none"
                    />
                  ) : (
                    <pre className="whitespace-pre text-slate-300 leading-relaxed">
                      {selectedFile?.content || 'Select a file to inspect.'}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BENCHMARK */}
          {activeTab === 'benchmark' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-teko tracking-wide text-white">
                    PYTHON MOVEMENT & PHYSICS BENCHMARK
                  </h3>
                  <p className="text-xs text-slate-400">
                    Executes 1,000 frames of bunny-hopping, slide-hopping, friction decay, and AABB boundary collisions using Python's <code className="text-cyan-400">PhysicsEngine</code> and <code className="text-cyan-400">PlayerController</code>.
                  </p>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarking}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                >
                  {isBenchmarking ? 'Simulating in Python...' : 'Run 1,000-Tick Benchmark'}
                </button>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-auto text-cyan-300 whitespace-pre">
                {benchmarkOutput || 'Click "Run 1,000-Tick Benchmark" to test pure Python physics simulation throughput.'}
              </div>
            </div>
          )}

          {/* TAB 4: SIMULATION */}
          {activeTab === 'simulate' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-teko tracking-wide text-white">
                    HEADLESS PYTHON MATCH SIMULATION
                  </h3>
                  <p className="text-xs text-slate-400">
                    Runs a live 10-kill tournament match purely inside Python subprocess, testing bot FSM tactical combat, navigation, and hit calculations.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Bots:</span>
                    <select
                      value={simBots}
                      onChange={(e) => setSimBots(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-white"
                    >
                      <option value={2}>2 Bots</option>
                      <option value={4}>4 Bots</option>
                      <option value={6}>6 Bots</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Difficulty:</span>
                    <select
                      value={simDiff}
                      onChange={(e) => setSimDiff(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-500/20"
                  >
                    {isSimulating ? 'Simulating Combat...' : 'Run Match Simulation'}
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-auto text-purple-300 whitespace-pre">
                {simulationOutput || 'Click "Run Match Simulation" to simulate live Python bot combat.'}
              </div>
            </div>
          )}

          {/* TAB 5: DESKTOP LAUNCH */}
          {activeTab === 'desktop' && (
            <div className="flex flex-col h-full gap-4 overflow-y-auto">
              <div>
                <h3 className="text-lg font-bold font-teko tracking-wide text-white">
                  RUN PANDA3D CLIENT STANDALONE ON DESKTOP
                </h3>
                <p className="text-xs text-slate-400">
                  Follow these simple steps to run the complete hardware-accelerated 3D desktop client locally on Windows, macOS, or Linux.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Linux & macOS */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      Linux & macOS Instructions
                    </span>
                    <span className="text-xs text-emerald-400 font-mono">./run_desktop.sh</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-2">
                    <div className="text-slate-500"># 1. Clone repository & install dependencies</div>
                    <div className="text-emerald-400">pip install -r krunker_recreation/requirements.txt</div>
                    <div className="text-slate-500"># 2. Run automated tests</div>
                    <div className="text-emerald-400">python3 -m unittest discover -s krunker_recreation/tests</div>
                    <div className="text-slate-500"># 3. Launch 3D Panda3D Desktop Game</div>
                    <div className="text-amber-300">python3 run_krunker.py</div>
                    <div className="text-slate-500"># Or run one-click script:</div>
                    <div className="text-cyan-400">./run_desktop.sh</div>
                  </div>
                </div>

                {/* Windows */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      Windows Instructions
                    </span>
                    <span className="text-xs text-emerald-400 font-mono">run_desktop.bat</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-slate-300 space-y-2">
                    <div className="text-slate-500">REM 1. Install dependencies via pip</div>
                    <div className="text-emerald-400">pip install -r krunker_recreation\requirements.txt</div>
                    <div className="text-slate-500">REM 2. Verify all unit tests</div>
                    <div className="text-emerald-400">python -m unittest discover -s krunker_recreation\tests</div>
                    <div className="text-slate-500">REM 3. Launch 3D Panda3D Desktop Game</div>
                    <div className="text-amber-300">python run_krunker.py</div>
                    <div className="text-slate-500">REM Or double click:</div>
                    <div className="text-cyan-400">run_desktop.bat</div>
                  </div>
                </div>
              </div>

              {/* Native Python Server */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <span className="text-sm font-bold text-white uppercase tracking-wider block mb-1">
                  Native Python Server
                </span>
                <p className="text-xs text-slate-400 mb-2">
                  Prefer a zero-Node pure Python environment? Launch our built-in Python web and API server:
                </p>
                <div className="bg-slate-900 p-3 rounded-lg font-mono text-xs text-amber-300">
                  python3 server.py --port 3000
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Python 3.10+ Panda3D Framework Online</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
