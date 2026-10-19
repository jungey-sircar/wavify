import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { makeTheme } from "./theme";
import { streamURL, coverOf, songMini, api } from "./api";

const DL_DIR = FileSystem.documentDirectory + "downloads/";

const Ctx = createContext(null);
export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("store missing provider");
  return v;
};

const load = async (key, fallback) => {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export function StoreProvider({ children }) {
  const [mode, setMode] = useState("dark");
  const [accentId, setAccentId] = useState("red");
  const [quality, setQualitySt] = useState(3);
  const [anim, setAnimSt] = useState(true);
  const [searches, setSearches] = useState([]);
  const [recent, setRecent] = useState([]);
  const [liked, setLiked] = useState([]);
  const [downloads, setDownloads] = useState({});
  const [busy, setBusy] = useState({});
  const [progress, setProgress] = useState({});
  const [ready, setReady] = useState(false);
  const busyRef = useRef({});
  const resumes = useRef({}); // id -> resumeData from interrupted transfer

  useEffect(() => {
    (async () => {
      const [m, r, l, d, a, q, av, sh] = await Promise.all([
        load("wave.mode", null),
        load("wave.recent", []),
        load("wave.liked", []),
        load("wave.downloads", {}),
        load("wave.accent", null),
        load("wave.quality", null),
        load("wave.anim", null),
        load("wave.searches", []),
      ]);
      if (m === "dark" || m === "light") setMode(m);
      if (a) setAccentId(a);
      if (q >= 0 && q <= 4) setQualitySt(q);
      if (av === false) setAnimSt(false);
      setSearches(sh);
      setRecent(r);
      setLiked(l);
      setDownloads(d);
      setReady(true);
    })();
  }, []);

  const persist = (key, v) => AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});

  const toggleTheme = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      persist("wave.mode", next);
      return next;
    });
  }, []);

  const setAccent = useCallback((id) => {
    setAccentId(id);
    persist("wave.accent", id);
  }, []);

  const setQuality = useCallback((q) => {
    setQualitySt(q);
    persist("wave.quality", q);
  }, []);

  const setAnim = useCallback((v) => {
    setAnimSt(!!v);
    persist("wave.anim", !!v);
  }, []);

  const pushSearch = useCallback((term) => {
    const t0 = term.trim();
    if (!t0) return;
    setSearches((s) => {
      const next = [t0, ...s.filter((x) => x !== t0)].slice(0, 8);
      persist("wave.searches", next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((term) => {
    setSearches((s) => {
      const next = s.filter((x) => x !== term);
      persist("wave.searches", next);
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    persist("wave.searches", []);
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    persist("wave.recent", []);
  }, []);

  const pushRecent = useCallback((song) => {
    setRecent((r) => {
      const item = songMini(song);
      const next = [item, ...r.filter((x) => x.id !== item.id)].slice(0, 30);
      persist("wave.recent", next);
      return next;
    });
  }, []);

  const toggleLike = useCallback((song) => {
    setLiked((l) => {
      const exists = l.some((x) => x.id === song.id);
      const next = exists ? l.filter((x) => x.id !== song.id) : [songMini(song), ...l].slice(0, 200);
      persist("wave.liked", next);
      return next;
    });
  }, []);

  const isLiked = useCallback((id) => liked.some((x) => x.id === id), [liked]);
  const isDownloaded = useCallback((id) => !!downloads[id], [downloads]);

  const removeDownload = useCallback((id) => {
    FileSystem.deleteAsync(DL_DIR + id + ".m4a", { idempotent: true }).catch(() => {});
    FileSystem.deleteAsync(DL_DIR + id + ".jpg", { idempotent: true }).catch(() => {});
    resumes.current[id] = null;
    setDownloads((d) => {
      const next = { ...d };
      delete next[id];
      persist("wave.downloads", next);
      return next;
    });
  }, []);

  const fetchToFile = useCallback(async (url, to, id) => {
    const onProgress = (info) => {
      if (info && info.totalBytesExpectedToWrite > 0) {
        const r = Math.min(1, info.totalBytesWritten / info.totalBytesExpectedToWrite);
        setProgress((p) => ({ ...p, [id]: r }));
      }
    };
    const resumeData = resumes.current[id] || null;
    const resumable = FileSystem.createDownloadResumable(url, to, { sessionType: FileSystem.FileSystemSessionType.BACKGROUND }, onProgress, resumeData);
    try {
      return await resumable.downloadAsync();
    } catch (e) {
      try {
        const sav = resumable.savable();
        if (sav && sav.resumeData) resumes.current[id] = sav.resumeData;
      } catch {}
      throw e;
    }
  }, []);

  const download = useCallback(
    async (song) => {
      const id = song.id;
      if (!id || downloads[id] || busyRef.current[id]) return;
      busyRef.current[id] = true;
      setBusy((b) => ({ ...b, [id]: true }));
      setProgress((p) => ({ ...p, [id]: 0 }));
      try {
        await FileSystem.makeDirectoryAsync(DL_DIR, { intermediates: true }).catch(() => {});
        let s = song;
        let url = streamURL(s, quality);
        if (!url) {
          // mini objects (now playing, history, likes) lack URLs — fetch the full record
          const full = await api.song(id);
          s = full?.data ?? full;
          url = streamURL(s, quality);
        }
        if (!url) throw new Error("no stream url");
        const file = await fetchToFile(url, DL_DIR + id + ".m4a", id);
        if (!file || !file.uri) throw new Error("download failed");
        let cover = null;
        const c = coverOf(s);
        if (c) {
          cover = await FileSystem.downloadAsync(c, DL_DIR + id + ".jpg")
            .then((r) => r.uri)
            .catch(() => null);
        }
        const meta = { ...songMini(song), cover, file: file.uri };
        resumes.current[id] = null;
        setDownloads((d) => {
          const next = { ...d, [id]: meta };
          persist("wave.downloads", next);
          return next;
        });
      } catch (e) {
        console.warn("wavify download failed [" + id + "]", e?.message ?? e);
        // keep resumeData so the next tap continues where it stopped
      } finally {
        busyRef.current[id] = false;
        setBusy((b) => {
          const n = { ...b };
          delete n[id];
          return n;
        });
        setProgress((p) => {
          const n = { ...p };
          delete n[id];
          return n;
        });
      }
    },
    [downloads, fetchToFile, quality]
  );

  const t = makeTheme(mode, accentId);
  const value = {
    t, mode, toggleTheme, ready, accent: accentId, setAccent,
    quality, setQuality, anim, setAnim,
    searches, pushSearch, removeSearch, clearSearches, clearRecent,
    recent, liked, downloads, busy, progress,
    pushRecent, toggleLike, isLiked,
    download, removeDownload, isDownloaded, dlDir: DL_DIR,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
