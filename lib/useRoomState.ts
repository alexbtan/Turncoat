"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientRoom } from "./types";

interface Options {
  intervalMs?: number;
}

interface RoomStateResult {
  room: ClientRoom | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setRoom: (room: ClientRoom) => void;
}

/**
 * Polls the room state endpoint at a fixed interval. Pauses while the tab is
 * hidden and resumes (with an immediate fetch) when it becomes visible again.
 */
export function useRoomState(
  code: string,
  playerId: string | null,
  options: Options = {},
): RoomStateResult {
  const intervalMs = options.intervalMs ?? 1500;
  const [room, setRoom] = useState<ClientRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const url = playerId
        ? `/api/rooms/${code}/state?playerId=${encodeURIComponent(playerId)}`
        : `/api/rooms/${code}/state`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Room not found.");
      } else {
        setRoom((data as { room: ClientRoom }).room);
        setError(null);
      }
    } catch {
      // Network blip; keep the previous state and try again next tick.
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [code, playerId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      void refresh();
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          void refresh();
        }
      }, intervalMs);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, intervalMs]);

  return { room, error, loading, refresh, setRoom };
}
