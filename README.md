# Turncoat

A free, browser-based multiplayer word game built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

Create a room, share the 4-letter code, pick a mode, and play. State syncs across players via lightweight HTTP polling against an in-memory store, so there's no database or extra infrastructure to manage.

## Features

- Create / join rooms by code (no accounts)
- **Classic** mode: two teams (red / blue), each with a spymaster and operatives
- **Turncoat mode**: 1 spymaster + 3 guessers vs the clock — one player is a secret traitor
- Spymaster clues (word + number); operatives or guessers reveal cards (by click or majority vote)
- Correct/incorrect/neutral/assassin logic, turn passing, and win detection
- Separate spymaster vs operative/guesser board views (honest players never receive the key)
- Live updates via polling, in-game log, end-turn, and host rematch
- Host-defined **custom word list** with a **mix slider** (0–100% of board words from your list)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. To test multiplayer, open a second browser (or an incognito window) and join with the room code.

### Solo testing (one browser)

As the room host in the lobby:

1. Click **Add test players** (fills the room to 4 with bots).
2. Click **Randomize teams** (Classic) or **Randomize roles** (Turncoat mode).
3. Use **Solo test mode → Playing as** to switch which player you control.
4. **Start game** / **Start mission** and play every role from one tab.

## How to play — Classic

1. One player creates a room and shares the 4-letter code. In the lobby, the host can paste custom words and set what percentage of the 25 board words come from that list (remainder uses the classic list).
2. Everyone joins and picks a team + role (spymaster or operative).
   - Each team needs at least one spymaster and one operative to start.
3. The host starts the game. The starting team has 9 cards, the other 8.
4. The active spymaster gives a one-word clue and a number.
5. That team's operatives click cards:
   - Their color: keep guessing (up to clue number + 1).
   - Neutral or opponent color: turn ends.
   - The assassin: instant loss.
6. First team to reveal all of its agents wins.

## How to play — Turncoat mode

A cooperative variant for exactly **4 players**: **1 spymaster + 3 guessers** race to find all **9 agents** within a set number of rounds — but one of the four is a secret **turncoat** trying to make the team lose.

- The host picks **Turncoat mode** in the lobby, sets the **rounds to win**, and assigns (or randomizes) 1 spymaster + 3 guessers. Custom words work here too.
- On start, one of the four players is secretly chosen as the turncoat. The turncoat **sees the full key** (like the spymaster) and gets a private briefing.
- The board has **9 agents, 15 bystanders, 1 assassin**.
- Each round the spymaster gives a clue; guessers then **vote on cards**. A card is revealed only when **2 of 3 guessers** select it (votes are public and sit until changed). Guessers can also majority-vote to **end the round**.
- **Agent** revealed → keep going. **Bystander** → round ends. **Assassin** → instant loss.
- **The team wins** if all 9 agents are found. **The turncoat wins** if the assassin is revealed, the round clock runs out, or the guessers wrongly accuse the spymaster.
- At any time the guessers can press **"Accuse: spymaster is the turncoat"**. If **all 3** agree:
  - If the spymaster really was the turncoat → **team wins**.
  - If the turncoat was actually a guesser → **false accusation, turncoat wins**. (So the accuse button is a trap the turncoat wants to spring.)
- There is intentionally **no button to accuse a guesser** — when the turncoat is a guesser, the honest players' only defense is refusing to form a majority with them.

Solo testing works the same way: add test players, randomize roles, then use the **Playing as** switcher (the turncoat sees the key and briefing when you switch to them).

## Project structure

```
app/
  page.tsx                 Home (create / join)
  room/[code]/page.tsx     Lobby + game view (client, polls state)
  api/rooms/...            Route handlers (create, join, team, start,
                           state, clue, guess, end-turn, reset, coop/*)
components/                Lobby, LobbyCoop, Board, GamePanel, GamePanelCoop
lib/
  types.ts                 Shared types
  words.ts                 Word list
  store.ts                 In-memory room store (swappable)
  game.ts                  Classic rules + client projection
  gameCoop.ts              Turncoat mode rules
  client.ts                Client API + localStorage identity
  useRoomState.ts          Polling hook
```

## Deployment (Netlify)

This repo includes `netlify.toml` and uses `@netlify/plugin-nextjs`. Connect the
repo in Netlify and deploy with the default Next.js settings.

> **Storage:** On Netlify, rooms are persisted with [Netlify Blobs](https://docs.netlify.com/blobs/overview/)
> (`lib/store-netlify.ts`) so create/join/poll work across serverless invocations.
> Local `npm run dev` uses an in-memory Map (`lib/store-memory.ts`). For local testing
> with Blobs, run `netlify dev` instead.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – run the production build
- `npm run lint` – lint
