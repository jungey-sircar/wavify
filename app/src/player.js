import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useStore } from "./store";
import { songMini, coverOf, artistsOf } from "./api";

const Ctx = createContext(null);
export const usePlayer = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("player missing provider");
  return v;
};

// prefer an already-downloaded file so playback works fully offline
const sourceFor = (song, downloads) => {
  const f = downloads[song.id]?.file;
  if (f?.uri) return { uri: f.uri };
  const u = song.downloadUrl?.[3]?.url ?? song.downloadUrl?.[1]?.url;
  return u ? { uri: u } : null;
};

export function PlayerProvider({ children }) {
  const { downloads, pushRecent } = useStore();
  const playerRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    }).catch(() => {});
  }, []);

  const current = index >= 0 ? queue[index] : null;

  const goTo = useCallback(
    (i, autoplay = true) => {
      const q = queueRef.current;
      const song = q[i];
      if (!song || !song.id) return;
      const uri = sourceFor(song, downloads);
      if (!uri) return;
      indexRef.current = i;
      setIndex(i);
      setPosition(0);
      setDuration(song.duration ? song.duration : 0);
      try {
        if (!playerRef.current) {
          playerRef.current = createAudioPlayer(uri);
        } else {
          playerRef.current.replace(uri);
        }
      } catch {
        try {
          playerRef.current = createAudioPlayer(uri);
        } catch (e) {
          console.warn("player init failed:", e?.message ?? e);
          setPlaying(false);
          return;
        }
      }
      const p = playerRef.current;
      if (autoplay) {
        try {
          p.play();
          setPlaying(true);
        } catch (e) {
          console.warn("player play failed:", e?.message ?? e);
          setPlaying(false);
        }
      } else {
        setPlaying(false);
      }
      pushRecent(song);
    },
    [downloads, pushRecent]
  );

  const play = useCallback(
    (song, list) => {
      if (!song || !song.id) return;
      const src = (list && list.length ? list : [song]).filter((x) => x && x.id);
      const q = src.map((x) => ({ ...x }));
      if (!q.length) return;
      queueRef.current = q;
      setQueue(q);
      const found = q.findIndex((x) => x.id === song.id);
      goTo(found >= 0 ? found : 0, true);
    },
    [goTo]
  );

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p || indexRef.current < 0) return;
    if (p.playing) {
      p.pause();
      setPlaying(false);
    } else {
      p.play();
      setPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    try {
      playerRef.current?.pause();
    } catch {}
    setPlaying(false);
  }, []);

  const seek = useCallback((sec) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.seekTo(Math.max(0, sec));
      setPosition(sec);
    } catch {}
  }, []);

  const skip = useCallback(
    (delta) => {
      const q = queueRef.current;
      const i = indexRef.current + delta;
      if (i >= 0 && i < q.length) goTo(i, true);
      else if (i === q.length && q.length) goTo(0, true);
    },
    [goTo]
  );

  const close = useCallback(() => {
    try {
      playerRef.current?.pause();
    } catch {}
    setPlaying(false);
    indexRef.current = -1;
    setIndex(-1);
    queueRef.current = [];
    setQueue([]);
  }, []);

  // progress polling + auto-advance to next track when finished
  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      let pos = 0;
      let dur = 0;
      try {
        pos = p.currentTime ?? 0;
        dur = p.duration > 0 ? p.duration : 0;
      } catch {}
      setPosition(pos);
      if (dur > 0) setDuration(dur);
      if (dur > 0 && pos > 0 && pos >= dur - 0.35 && p.playing) {
        skip(1);
      }
    }, 400);
    return () => clearInterval(id);
  }, [skip]);

  const value = {
    current, queue, index, playing, position, duration,
    mini: current ? songMini(current) : null,
    cover: current ? coverOf(current) : null,
    artists: current ? artistsOf(current) : [],
    play, toggle, pause, seek, skip, close,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
