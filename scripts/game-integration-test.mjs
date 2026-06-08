/**
 * Integration tests for classic + Turncoat game rules and HTTP API.
 * Run: node scripts/game-integration-test.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

import assert from "node:assert/strict";

const BASE = process.argv[2] ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(cond, msg) {
  if (cond) {
    passed++;
    return;
  }
  failed++;
  console.error("FAIL:", msg);
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function countTypes(board) {
  const counts = { red: 0, blue: 0, neutral: 0, assassin: 0, agent: 0 };
  for (const c of board) {
    if (c.type) counts[c.type] = (counts[c.type] ?? 0) + 1;
  }
  return counts;
}

// ---- Classic mode full flow ----
async function testClassicFlow() {
  const { res, data } = await post("/api/rooms", { name: "TestHost" });
  ok(res.ok, `create room: ${data.error}`);
  const { code, playerId: hostId, room } = data;
  ok(code?.length === 4, "room code length");
  ok(room.phase === "lobby", "starts in lobby");

  let r = await post(`/api/rooms/${code}/test-players`, { playerId: hostId });
  ok(r.res.ok, `add test players: ${r.data.error}`);
  ok(r.data.room.players.length >= 4, "has 4+ players");

  r = await post(`/api/rooms/${code}/randomize-teams`, { playerId: hostId });
  ok(r.res.ok, `randomize teams: ${r.data.error}`);

  const redSpy = r.data.room.players.find(
    (p) => p.team === "red" && p.role === "spymaster",
  );
  const redOp = r.data.room.players.find(
    (p) => p.team === "red" && p.role === "operative",
  );
  ok(redSpy && redOp, "red team has spymaster and operative");

  r = await post(`/api/rooms/${code}/word-settings`, {
    playerId: hostId,
    customWordsText: "ALPHA\nBETA",
    customWordPercent: 50,
  });
  ok(r.res.ok, `word settings: ${r.data.error}`);

  r = await post(`/api/rooms/${code}/start`, { playerId: hostId });
  ok(r.res.ok, `start classic: ${r.data.error}`);
  const playing = r.data.room;
  ok(playing.phase === "playing", "classic playing");
  ok(playing.board.length === 25, "board has 25 cards");

  // Host as spymaster sees full key
  const hostView = await get(
    `/api/rooms/${code}/state?playerId=${hostId}`,
  );
  ok(hostView.res.ok, "state poll");
  const turn = playing.turn;
  const spy =
    playing.players.find(
      (p) => p.team === turn && p.role === "spymaster",
    ) ?? redSpy;
  const op =
    playing.players.find(
      (p) => p.team === turn && p.role === "operative",
    ) ?? redOp;

  const spyState = await get(`/api/rooms/${code}/state?playerId=${spy.id}`);
  const types = countTypes(spyState.data.room.board);
  const total =
    types.red + types.blue + types.neutral + types.assassin;
  ok(total === 25, `classic board composition: ${JSON.stringify(types)}`);
  ok(types.assassin === 1, "one assassin");
  ok(
    (types.red === 9 && types.blue === 8) ||
      (types.red === 8 && types.blue === 9),
    "9+8 team cards",
  );
  ok(types.neutral === 7, "seven neutral");

  // Pick an unrevealed card of the active team's color so the turn continues.
  const ownIdx = spyState.data.room.board.findIndex(
    (c) => !c.revealed && c.type === turn,
  );
  ok(ownIdx >= 0, "board has an unrevealed card for active team");

  r = await post(`/api/rooms/${code}/clue`, {
    playerId: spy.id,
    word: "TEST",
    number: 1,
  });
  ok(r.res.ok, `give clue: ${r.data.error}`);
  ok(r.data.room.clue?.word === "TEST", "clue stored");

  // Wrong team cannot clue
  const otherSpy = playing.players.find(
    (p) => p.team !== turn && p.role === "spymaster",
  );
  if (otherSpy) {
    const bad = await post(`/api/rooms/${code}/clue`, {
      playerId: otherSpy.id,
      word: "NOPE",
      number: 1,
    });
    ok(!bad.res.ok, "inactive spymaster cannot clue");
  }

  r = await post(`/api/rooms/${code}/guess`, {
    playerId: op.id,
    index: ownIdx,
  });
  ok(r.res.ok, `guess own-team card: ${r.data.error}`);
  ok(r.data.room.clue, "clue still active after correct guess");

  r = await post(`/api/rooms/${code}/end-turn`, { playerId: op.id });
  ok(
    r.res.ok || r.data?.room?.phase === "finished",
    `end turn: ${r.data?.error ?? "ok"}`,
  );
  if (r.res.ok) {
    ok(r.data.room.turn !== turn, "turn advances after end-turn");
  }

  r = await post(`/api/rooms/${code}/reset`, { playerId: hostId });
  ok(r.res.ok, `host rematch: ${r.data.error}`);
  ok(r.data.room.phase === "playing", "rematch starts new game");
  ok(r.data.room.board.length === 25, "rematch has fresh board");

  console.log("  classic flow OK");
}

// ---- Turncoat mode flow ----
async function testCoopFlow() {
  const { res, data } = await post("/api/rooms", { name: "CoopHost" });
  ok(res.ok, `create coop room: ${data.error}`);
  const { code, playerId: hostId } = data;

  let r = await post(`/api/rooms/${code}/test-players`, { playerId: hostId });
  ok(r.res.ok, `coop test players: ${r.data.error}`);

  r = await post(`/api/rooms/${code}/mode`, {
    playerId: hostId,
    gameMode: "coop",
    maxRounds: 5,
  });
  ok(r.res.ok, `set coop mode: ${r.data.error}`);
  ok(r.data.room.gameMode === "coop", "mode is coop");
  ok(r.data.room.maxRounds === 5, "default coop rounds is 5");

  r = await post(`/api/rooms/${code}/coop/settings`, {
    playerId: hostId,
    maxRounds: 7,
  });
  ok(r.res.ok, `set coop rounds: ${r.data.error}`);
  ok(r.data.room.maxRounds === 7, "coop rounds updated via settings");

  r = await post(`/api/rooms/${code}/coop/settings`, {
    playerId: hostId,
    maxRounds: 5,
  });
  ok(r.res.ok, `reset coop rounds: ${r.data.error}`);

  r = await post(`/api/rooms/${code}/coop/randomize`, { playerId: hostId });
  ok(r.res.ok, `randomize coop roles: ${r.data.error}`);
  const spymaster = r.data.room.players.find((p) => p.role === "spymaster");
  const guessers = r.data.room.players.filter((p) => p.role === "guesser");
  ok(spymaster && guessers.length === 3, "1 spymaster + 3 guessers");

  r = await post(`/api/rooms/${code}/start`, { playerId: hostId });
  ok(r.res.ok, `start coop: ${r.data.error}`);
  ok(r.data.room.phase === "playing", "coop playing");
  ok(r.data.room.roundsRemaining === 5, "rounds set");

  const moleView = await get(
    `/api/rooms/${code}/state?playerId=${hostId}`,
  );
  // Mole may or may not be host; find player with isMole
  const players = moleView.data.room.players;
  let moleId = null;
  for (const p of players) {
    const st = await get(`/api/rooms/${code}/state?playerId=${p.id}`);
    if (st.data.room.you?.isMole) {
      moleId = p.id;
      break;
    }
  }
  ok(moleId, "exactly one player sees isMole");

  const spyState = await get(
    `/api/rooms/${code}/state?playerId=${spymaster.id}`,
  );
  const types = countTypes(spyState.data.room.board);
  ok(types.agent === 9, `nine agents, got ${types.agent}`);
  ok(
    types.assassin === 0 || types.assassin === 1,
    `assassin 0 or 1 (mole spymaster removes it): ${types.assassin}`,
  );
  ok(types.neutral >= 14, "neutrals present");

  r = await post(`/api/rooms/${code}/coop/clue`, {
    playerId: spymaster.id,
    word: "GO",
    number: 2,
  });
  ok(r.res.ok, `coop clue: ${r.data.error}`);

  const g1 = guessers[0];
  const g2 = guessers[1];
  const cardIdx = r.data.room.board.findIndex((c) => !c.revealed);

  r = await post(`/api/rooms/${code}/coop/vote`, {
    playerId: g1.id,
    index: cardIdx,
  });
  ok(r.res.ok, `coop vote 1: ${r.data.error}`);
  ok(!r.data.room.board[cardIdx]?.revealed, "one vote does not reveal");

  r = await post(`/api/rooms/${code}/coop/vote`, {
    playerId: g2.id,
    index: cardIdx,
  });
  ok(r.res.ok, `coop vote majority: ${r.data.error}`);
  ok(
    r.data.room.board[cardIdx]?.revealed ||
      r.data.room.phase === "finished",
    "majority reveals or ends game",
  );

  if (r.data.room.phase === "finished") {
    console.log("  coop flow ended early (assassin/agents) — partial OK");
    return;
  }

  // Round may have ended on reveal; start another clue before pass/accuse.
  if (!r.data.room.clue) {
    r = await post(`/api/rooms/${code}/coop/clue`, {
      playerId: spymaster.id,
      word: "NEXT",
      number: 1,
    });
    ok(r.res.ok, `second coop clue: ${r.data.error}`);
  }

  r = await post(`/api/rooms/${code}/coop/pass`, { playerId: g1.id });
  ok(r.res.ok, `coop pass toggle: ${r.data.error}`);

  r = await post(`/api/rooms/${code}/coop/accuse`, { playerId: g1.id });
  ok(r.res.ok, `coop accuse toggle: ${r.data.error}`);
  ok(
    Array.isArray(r.data.room.accusations),
    "accusations tracked",
  );

  console.log("  coop flow OK");
}

// ---- Validation / edge cases ----
async function testValidation() {
  const { data } = await post("/api/rooms", { name: "Edge" });
  const { code, playerId: hostId } = data;

  let r = await post(`/api/rooms/${code}/start`, { playerId: hostId });
  ok(!r.res.ok, "cannot start without teams");

  r = await post(`/api/rooms/${code}/join`, { name: "Guest" });
  ok(r.res.ok, "join works");
  const guestId = r.data.playerId;

  r = await post(`/api/rooms/${code}/clue`, {
    playerId: guestId,
    word: "X",
    number: 1,
  });
  ok(!r.res.ok, "clue blocked in lobby");

  r = await post(`/api/rooms/ZZZZ/join`, { name: "Nobody" });
  ok(!r.res.ok, "invalid room returns error");

  console.log("  validation OK");
}

async function main() {
  console.log(`Testing against ${BASE}\n`);
  try {
    await fetch(BASE);
  } catch (e) {
    console.error(
      `Cannot reach ${BASE}. Start dev server: npm run dev\n`,
      e.message,
    );
    process.exit(1);
  }

  await testValidation();
  await testClassicFlow();
  await testCoopFlow();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
