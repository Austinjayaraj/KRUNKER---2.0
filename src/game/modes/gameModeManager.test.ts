import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialModeState,
  updateGameModeTick,
  handleKillScore,
  updateHardpointCapture,
} from './gameModeManager';

test('createInitialModeState initializes valid mode state', () => {
  const ffa = createInitialModeState('ffa');
  assert.equal(ffa.mode, 'ffa');
  assert.equal(ffa.isMatchOver, false);
  assert.equal(ffa.targetKills, 15);
  assert.equal(ffa.winner, null);

  const tdm = createInitialModeState('tdm');
  assert.equal(tdm.mode, 'tdm');
  assert.equal(tdm.targetKills, 25);
});

test('handleKillScore triggers victory on kill threshold', () => {
  const state = createInitialModeState('ffa');
  const res1 = handleKillScore(state, 'ffa', 'PlayerOne', 14);
  assert.equal(res1.isVictory, false);
  assert.equal(res1.nextState.isMatchOver, false);

  const res2 = handleKillScore(state, 'ffa', 'PlayerOne', 15);
  assert.equal(res2.isVictory, true);
  assert.equal(res2.nextState.isMatchOver, true);
  assert.equal(res2.nextState.winner, 'PlayerOne');
});

test('updateHardpointCapture awards points to dominating team', () => {
  let state = createInitialModeState('hardpoint');
  state = updateHardpointCapture(state, 1, 0, 1.0);
  assert.ok(state.blueScore > 0);
  assert.equal(state.redScore, 0);

  state = updateHardpointCapture(state, 0, 1, 1.0);
  assert.ok(state.redScore > 0);
});
