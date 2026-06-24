/**
 * Unit-style tests for lib/game.ts and lib/gameCoop.ts (no HTTP).
 * Requires tsx: npx tsx scripts/game-logic-test.mjs
 */

import assert from "node:assert/strict";
import {
  BOARD_SIZE,
  addTestPlayers,
  createRoom,
  endTurn,
  findPlayer,
  generateBoard,
  guessCard,
  newPlayerId,
  pickBoardWords,
  randomizeTeams,
  setWordSettings,
  returnToLobby,
  startGame,
  submitClue,
  toClientRoom,
} from "../lib/game.ts";
import {
  COOP_AGENTS,
  coopAccuse,
  coopPass,
  coopVote,
  randomizeCoopRoles,
  setCoopSettings,
  startCoopGame,
  submitCoopClue,
  validateCoopLobby,
} from "../lib/gameCoop.ts";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL ${name}:`, e.message);
  }
}

test("generateBoard has 25 cards with valid distribution", () => {
  const { board, startingTeam } = generateBoard("red");
  assert.equal(board.length, BOARD_SIZE);
  const counts = { red: 0, blue: 0, neutral: 0, assassin: 0 };
  for (const c of board) {
    counts[c.type]++;
    assert.equal(c.revealed, false);
  }
  assert.equal(counts.assassin, 1);
  assert.equal(counts.neutral, 7);
  if (startingTeam === "red") {
    assert.equal(counts.red, 9);
    assert.equal(counts.blue, 8);
  } else {
    assert.equal(counts.red, 8);
    assert.equal(counts.blue, 9);
  }
});

test("pickBoardWords respects custom percent", () => {
  const words = pickBoardWords({
    customWords: ["CUSTOMONE", "CUSTOMTWO", "CUSTOMTHREE"],
    customWordPercent: 100,
  });
  assert.equal(words.length, BOARD_SIZE);
});

test("classic win on last team card", () => {
  const hostId = newPlayerId();
  const room = createRoom(hostId);
  room.players.push({
    id: hostId,
    name: "H",
    team: "red",
    role: "spymaster",
  });
  room.players.push({
    id: newPlayerId(),
    name: "O",
    team: "red",
    role: "operative",
  });
  room.players.push({
    id: newPlayerId(),
    name: "B",
    team: "blue",
    role: "spymaster",
  });
  room.players.push({
    id: newPlayerId(),
    name: "O2",
    team: "blue",
    role: "operative",
  });
  startGame(room);
  room.turn = "red";
  const op = room.players.find((p) => p.role === "operative" && p.team === "red");
  const spy = room.players.find((p) => p.role === "spymaster" && p.team === "red");

  // Force board: one red card left
  room.board = [
    { word: "A", type: "red", revealed: false },
    ...Array(24).fill(null).map((_, i) => ({
      word: `N${i}`,
      type: "neutral",
      revealed: true,
    })),
  ];

  submitClue(room, spy, "GO", 0);
  const r = guessCard(room, op, 0);
  assert.ok(r.ok);
  assert.equal(room.phase, "finished");
  assert.equal(room.winner, "red");
});

test("assassin ends game", () => {
  const hostId = newPlayerId();
  const room = createRoom(hostId);
  const opId = newPlayerId();
  room.players.push({ id: hostId, name: "S", team: "red", role: "spymaster" });
  room.players.push({ id: opId, name: "O", team: "red", role: "operative" });
  room.players.push({ id: newPlayerId(), name: "B", team: "blue", role: "spymaster" });
  room.players.push({ id: newPlayerId(), name: "O2", team: "blue", role: "operative" });
  startGame(room);
  room.turn = "red";
  room.board = [
    { word: "KILL", type: "assassin", revealed: false },
    ...Array(24).fill(null).map((_, i) => ({
      word: `N${i}`,
      type: "neutral",
      revealed: true,
    })),
  ];
  const op = findPlayer(room, opId);
  const spy = room.players.find((p) => p.role === "spymaster" && p.team === "red");
  submitClue(room, spy, "DIE", 1);
  guessCard(room, op, 0);
  assert.equal(room.phase, "finished");
  assert.equal(room.winner, "blue");
});

test("operative view hides unrevealed types", () => {
  const hostId = newPlayerId();
  const opId = newPlayerId();
  const room = createRoom(hostId);
  room.players.push({ id: hostId, name: "S", team: "red", role: "spymaster" });
  room.players.push({ id: opId, name: "O", team: "red", role: "operative" });
  startGame(room);
  const client = toClientRoom(room, opId);
  const hidden = client.board.filter((c) => !c.revealed && c.type !== undefined);
  assert.equal(hidden.length, 0);
  const spyView = toClientRoom(room, hostId);
  const withType = spyView.board.filter((c) => c.type !== undefined);
  assert.equal(withType.length, 25);
});

test("coop lobby validation", () => {
  const room = createRoom(newPlayerId());
  room.gameMode = "coop";
  assert.ok(!validateCoopLobby(room).ok);
  for (let i = 0; i < 4; i++) {
    room.players.push({
      id: newPlayerId(),
      name: `P${i}`,
      team: null,
      role: i === 0 ? "spymaster" : "guesser",
    });
  }
  assert.ok(validateCoopLobby(room).ok);
});

test("coop majority vote reveals card", () => {
  const hostId = newPlayerId();
  const room = createRoom(hostId);
  room.gameMode = "coop";
  const ids = [hostId, newPlayerId(), newPlayerId(), newPlayerId()];
  room.players = ids.map((id, i) => ({
    id,
    name: `P${i}`,
    team: null,
    role: i === 0 ? "spymaster" : "guesser",
  }));
  randomizeCoopRoles(room);
  startCoopGame(room);
  const spy = room.players.find((p) => p.role === "spymaster");
  const guessers = room.players.filter((p) => p.role === "guesser");
  submitCoopClue(room, spy, "TEST", 2);

  const idx = 0;
  coopVote(room, guessers[0], idx);
  assert.equal(room.board[idx].revealed, false);
  coopVote(room, guessers[1], idx);
  assert.equal(room.board[idx].revealed, true);
});

test("coop accuse all guessers when mole is spymaster", () => {
  const room = createRoom(newPlayerId());
  room.gameMode = "coop";
  room.players = [
    { id: "s", name: "S", team: null, role: "spymaster" },
    { id: "g1", name: "G1", team: null, role: "guesser" },
    { id: "g2", name: "G2", team: null, role: "guesser" },
    { id: "g3", name: "G3", team: null, role: "guesser" },
  ];
  startCoopGame(room);
  room.molePlayerId = "s";
  room.phase = "playing";
  for (const g of ["g1", "g2", "g3"]) {
    coopAccuse(room, findPlayer(room, g));
  }
  assert.equal(room.phase, "finished");
  assert.equal(room.coopOutcome, "agents");
});

test("coop max rounds setting applies on start", () => {
  const room = createRoom(newPlayerId());
  room.gameMode = "coop";
  room.players = [
    { id: "s", name: "S", team: null, role: "spymaster" },
    { id: "g1", name: "G1", team: null, role: "guesser" },
    { id: "g2", name: "G2", team: null, role: "guesser" },
    { id: "g3", name: "G3", team: null, role: "guesser" },
  ];
  assert.ok(setCoopSettings(room, 5).ok);
  assert.equal(room.maxRounds, 5);
  startCoopGame(room);
  assert.equal(room.roundsRemaining, 5);
});

test("returnToLobby resets finished game while keeping players", () => {
  const hostId = newPlayerId();
  const room = createRoom(hostId);
  room.players.push(
    { id: hostId, name: "H", team: "red", role: "spymaster" },
    { id: "o", name: "O", team: "red", role: "operative" },
    { id: "s", name: "S", team: "blue", role: "spymaster" },
    { id: "p", name: "P", team: "blue", role: "operative" },
  );
  startGame(room);
  room.phase = "finished";
  room.winner = "red";
  room.molePlayerId = "x";
  room.accusations = ["a"];
  room.guesserAccusations = { g1: ["a"] };

  assert.ok(returnToLobby(room).ok);
  assert.equal(room.phase, "lobby");
  assert.equal(room.board.length, 0);
  assert.equal(room.winner, null);
  assert.equal(room.molePlayerId, null);
  assert.deepEqual(room.accusations, []);
  assert.deepEqual(room.guesserAccusations, {});
  assert.equal(room.players.length, 4);
  assert.equal(room.players[0].role, "spymaster");
  assert.equal(returnToLobby(room).ok, false);
});

test("lobby helpers", () => {
  const hostId = newPlayerId();
  const room = createRoom(hostId);
  room.players.push({ id: hostId, name: "H", team: null, role: null });
  assert.ok(addTestPlayers(room).ok);
  assert.equal(room.players.length, 4);
  assert.ok(randomizeTeams(room).ok);
  assert.ok(setWordSettings(room, "FOO\nBAR", 25).ok);
});

console.log(`\nLogic: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
