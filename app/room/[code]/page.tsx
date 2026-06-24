"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Board } from "@/components/Board";
import { GamePanel } from "@/components/GamePanel";
import { GamePanelCoop } from "@/components/GamePanelCoop";
import { Lobby } from "@/components/Lobby";
import { LobbyCoop } from "@/components/LobbyCoop";
import { ModeSelector } from "@/components/ModeSelector";
import { SoloTestBar } from "@/components/SoloTestBar";
import * as api from "@/lib/client";
import {
  getStoredName,
  getStoredPlayerId,
  setStoredPlayerId,
} from "@/lib/client";
import type { ClientRoom, GameMode, Role, Team } from "@/lib/types";
import { useRoomState } from "@/lib/useRoomState";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code ?? "").toUpperCase();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  // Resolve identity: rejoin with stored id, or join fresh with stored name.
  useEffect(() => {
    let cancelled = false;
    async function ensureJoined() {
      const stored = getStoredPlayerId(code);
      const name = getStoredName();
      if (!name) {
        router.replace("/");
        return;
      }
      try {
        const res = await api.joinRoom(code, name, stored);
        if (cancelled) return;
        setStoredPlayerId(code, res.playerId);
        setPlayerId(res.playerId);
        setActivePlayerId(res.playerId);
      } catch (e) {
        if (cancelled) return;
        setJoinError(e instanceof Error ? e.message : "Could not join room.");
      } finally {
        if (!cancelled) setJoining(false);
      }
    }
    void ensureJoined();
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  const viewAs = activePlayerId ?? playerId;
  const { room, error, refresh, setRoom } = useRoomState(code, viewAs);
  const isHost = playerId === room?.hostId;

  // Wrap an action: run it, update room from the response, surface errors.
  const run = useCallback(
    async (fn: () => Promise<{ room: ClientRoom }>) => {
      setBusy(true);
      setActionError(null);
      try {
        const res = await fn();
        setRoom(res.room);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Action failed.");
        void refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh, setRoom],
  );

  const onPickTeam = (team: Team, role: Role) =>
    viewAs && run(() => api.setTeam(code, viewAs, team, role));
  const onStart = () => playerId && run(() => api.startGame(code, playerId));
  const onAddTestPlayers = () =>
    playerId && run(() => api.addTestPlayers(code, playerId));
  const onRandomizeTeams = () =>
    playerId && run(() => api.randomizeTeams(code, playerId));
  const onSaveWordSettings = (text: string, percent: number) =>
    playerId &&
    run(() => api.saveWordSettings(code, playerId, text, percent));
  const onReset = () => playerId && run(() => api.resetGame(code, playerId));
  const onReturnToLobby = () =>
    playerId && run(() => api.returnToLobby(code, playerId));

  const isCoop = room?.gameMode === "coop";

  useEffect(() => {
    document.documentElement.classList.toggle("tc-theme-turncoat", isCoop);
    return () => document.documentElement.classList.remove("tc-theme-turncoat");
  }, [isCoop]);

  // Classic actions
  const onClue = (word: string, number: number) =>
    viewAs &&
    run(() =>
      isCoop
        ? api.coopClue(code, viewAs, word, number)
        : api.giveClue(code, viewAs, word, number),
    );
  const onGuess = (index: number) =>
    viewAs &&
    run(() =>
      isCoop ? api.coopVote(code, viewAs, index) : api.guess(code, viewAs, index),
    );
  const onEndTurn = () => viewAs && run(() => api.endTurn(code, viewAs));

  // Mode + co-op actions
  const onSetMode = (mode: GameMode) =>
    playerId && run(() => api.setMode(code, playerId, mode));
  const onSetMaxRounds = (rounds: number) =>
    playerId && run(() => api.setCoopMaxRounds(code, playerId, rounds));
  const onPickRole = (role: Role) =>
    viewAs && run(() => api.setCoopRole(code, viewAs, role));
  const onCoopRandomize = () =>
    playerId && run(() => api.randomizeCoopRoles(code, playerId));
  const onPass = () => viewAs && run(() => api.coopPass(code, viewAs));
  const onAccuse = () => viewAs && run(() => api.coopAccuse(code, viewAs));
  const onAccuseGuesser = (targetId: string) =>
    viewAs && run(() => api.coopAccuseGuesser(code, viewAs, targetId));

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (joinError) {
    return (
      <CenteredMessage>
        <p className="tc-error">{joinError}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tc-btn-secondary mt-4"
        >
          Back home
        </button>
      </CenteredMessage>
    );
  }

  if (joining || !room) {
    return (
      <CenteredMessage>
        <p className="tc-muted">
          {error ? error : "Joining room…"}
        </p>
      </CenteredMessage>
    );
  }

  const canGuess = isCoop
    ? room.phase === "playing" &&
      room.you?.role === "guesser" &&
      !!room.clue
    : room.phase === "playing" &&
      room.you?.role === "operative" &&
      room.you?.team === room.turn &&
      !!room.clue;

  return (
    <main className="tc-page max-w-6xl py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tc-border)] pb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tc-link text-xl"
        >
          Turncoat
        </button>
        <div className="flex items-center gap-2">
          <span className="tc-muted text-sm">Room</span>
          <button
            type="button"
            onClick={copyCode}
            title="Copy code"
            className="tc-input-mono !w-auto px-3 py-1.5 text-base hover:border-[var(--tc-border-strong)]"
          >
            {code}
          </button>
          <span className="tc-muted w-14 text-xs">
            {copied ? "Copied" : ""}
          </span>
        </div>
      </header>

      {actionError && (
        <div className="tc-panel mb-4 border-l-4 border-l-[var(--tc-red)] bg-[var(--tc-danger-bg)] text-sm text-[var(--tc-danger)]">
          {actionError}
        </div>
      )}

      {isHost && viewAs && (
        <SoloTestBar
          room={room}
          hostPlayerId={playerId!}
          activePlayerId={viewAs}
          onActivePlayerChange={setActivePlayerId}
        />
      )}

      {room.phase === "lobby" ? (
        <>
          <ModeSelector
            room={room}
            isHost={isHost}
            onSetMode={onSetMode}
            busy={busy}
          />
          {isCoop ? (
            <LobbyCoop
              room={room}
              hostPlayerId={playerId!}
              onPickRole={onPickRole}
              onRandomize={onCoopRandomize}
              onSetMaxRounds={onSetMaxRounds}
              onSaveWordSettings={onSaveWordSettings}
              onAddTestPlayers={onAddTestPlayers}
              onStart={onStart}
              busy={busy}
            />
          ) : (
            <Lobby
              room={room}
              hostPlayerId={playerId!}
              onPickTeam={onPickTeam}
              onStart={onStart}
              onAddTestPlayers={onAddTestPlayers}
              onRandomizeTeams={onRandomizeTeams}
              onSaveWordSettings={onSaveWordSettings}
              busy={busy}
            />
          )}
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Board room={room} canGuess={canGuess} onGuess={onGuess} />
          {isCoop ? (
            <GamePanelCoop
              room={room}
              busy={busy}
              playerId={playerId!}
              onClue={onClue}
              onPass={onPass}
              onAccuse={onAccuse}
              onAccuseGuesser={onAccuseGuesser}
              onReset={onReset}
              onReturnToLobby={onReturnToLobby}
            />
          ) : (
            <GamePanel
              room={room}
              busy={busy}
              onClue={onClue}
              onEndTurn={onEndTurn}
              onReset={onReset}
              onReturnToLobby={onReturnToLobby}
              playerId={playerId!}
            />
          )}
        </div>
      )}
    </main>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {children}
    </main>
  );
}
