import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions, Animated, PanResponder } from "react-native";
import { Ionicons } from "../Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStore } from "../store";
import { usePlayer } from "../player";
import { Cover } from "../components";
import { BASE } from "../api";
import { shadow, PLAYER_THEME } from "../theme";

const W = Dimensions.get("window").width;

const parseLrc = (txt) => {
  if (!txt) return [];
  const out = [];
  for (const line of txt.split("\n")) {
    const times = [...line.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)];
    if (!times.length) continue;
    const text = line.replace(/\[[^\]]*\]/g, "").trim();
    for (const ts of times) {
      const t0 = parseInt(ts[1], 10) * 60 + parseFloat(ts[2].replace(":", "."));
      if (text || out.length) out.push({ t: t0, text: text || "…", });
    }
  }
  if (out.length) out.push({ t: 1e9, text: "" });
  return out.sort((a, b) => a.t - b.t);
};

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

export function NowPlaying({ onClose, insets }) {
  const safeBottom = (insets?.bottom ?? 0) + 16;
  const { t, anim, isLiked, toggleLike, isDownloaded, download, busy, progress } = useStore();
  const { mini, cover, artists, playing, toggle, pause, position, duration, seek, skip } = usePlayer();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState(null);
  const [lyrLoad, setLyrLoad] = useState(false);
  const [sleepEnd, setSleepEnd] = useState(null);
  const [scrub, setScrub] = useState(null);
  const scrollRef = useRef(null);
  const barW = useRef(0);
  const scrubRef = useRef(0);
  const song = mini;

  const scale = useRef(new Animated.Value(anim ? 0.94 : 1)).current;
  useEffect(() => {
    if (anim) {
      scale.setValue(0.94);
      Animated.spring(scale, { toValue: 1, friction: 9, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sleepEnd) return undefined;
    const id = setInterval(() => {
      if (Date.now() >= sleepEnd) {
        setSleepEnd(null);
        pause();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepEnd]);

  const sleepLeft = sleepEnd ? Math.max(0, Math.round((sleepEnd - Date.now()) / 60000)) : null;

  // lyrics: hydrate from the offline cache instantly, then fetch fresh + save
  useEffect(() => {
    if (!song) return undefined;
    let alive = true;
    const key = "wave.lyrics." + song.id;
    AsyncStorage.getItem(key)
      .then((v) => {
        if (v && alive) {
          try {
            setLyrics(JSON.parse(v));
            setLyrLoad(false);
          } catch {}
        }
      })
      .catch(() => {});
    setLyrLoad(true);
    fetch(`${BASE}/lyrics?id=${encodeURIComponent(song.id)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const l = j?.lyrics ?? null;
        if (l && (l.syncedLyrics || l.plainLyrics)) {
          setLyrics(l);
          AsyncStorage.setItem(key, JSON.stringify(l)).catch(() => {});
        } else if (!l) {
          setLyrics(null);
        }
      })
      .catch(() => {})
      .finally(() => alive && setLyrLoad(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  const liked = song ? isLiked(song.id) : false;
  const saved = song ? isDownloaded(song.id) : false;
  const downBusy = song ? !!busy[song.id] : false;
  const dur = duration || song?.duration || 0;
  const ratio = Math.min(1, dur > 0 ? position / dur : 0);
  const shown = scrub ?? ratio;

  const applyScrub = useCallback((x) => {
    const f = Math.min(1, Math.max(0, x / Math.max(1, barW.current)));
    scrubRef.current = f;
    setScrub(f);
  }, []);

  const scrubPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => dur > 0,
        onMoveShouldSetPanResponder: () => dur > 0,
        onPanResponderGrant: (e) => applyScrub(e.nativeEvent.locationX),
        onPanResponderMove: (e) => applyScrub(e.nativeEvent.locationX),
        onPanResponderRelease: () => {
          seek(scrubRef.current * dur);
          setScrub(null);
        },
        onPanResponderTerminate: () => setScrub(null),
      }),
    [dur, seek, applyScrub]
  );

  const lines = showLyrics ? parseLrc(lyrics?.syncedLyrics) : [];
  const activeIdx = showLyrics && lines.length
    ? Math.max(
        0,
        lines.filter((l) => l.t < 1e8).findIndex((l) => l.t > position) - 1
      )
    : 0;
  const scrollTo = showLyrics && lines.length ? Math.max(0, activeIdx * 40) : 0;

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ y: scrollTo, animated: anim });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, showLyrics]);

  if (!song) return null;

  return (
    <Animated.View style={[sp.fill, { backgroundColor: PLAYER_THEME.bg, transform: [{ scale }] }]}>
      <View style={[sp.wrap, { paddingBottom: safeBottom }]}>
        {/* Top bar — Spotify style */}
        <View style={sp.topRow}>
          <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
            <Ionicons name="chevron-down" size={28} color={PLAYER_THEME.ink} />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: PLAYER_THEME.muted, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" }}>
              PLAYING FROM PLAYLIST
            </Text>
            <Text numberOfLines={1} style={{ color: PLAYER_THEME.ink, fontSize: 12, fontWeight: "700", marginTop: 2, maxWidth: 180 }}>
              {song.album || "Wavify Mix"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <Pressable onPress={() => setSleepEnd((v) => (v ? null : Date.now() + 15 * 60 * 1000))} hitSlop={10}>
              <Ionicons name={sleepEnd ? "time" : "time-outline"} size={22} color={sleepEnd ? PLAYER_THEME.btnBg : PLAYER_THEME.ink} />
            </Pressable>
            <Pressable onPress={() => setShowLyrics((v) => !v)} hitSlop={10}>
              <Ionicons name={showLyrics ? "document-text" : "document-text-outline"} size={22} color={showLyrics ? PLAYER_THEME.btnBg : PLAYER_THEME.ink} />
            </Pressable>
          </View>
        </View>

        {sleepLeft !== null && (
          <Text style={{ color: PLAYER_THEME.muted, fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 4 }}>
            sleep timer · {sleepLeft}m left
          </Text>
        )}

        {showLyrics ? (
          <View style={{ flex: 1, marginTop: 14 }}>
            {lyrLoad ? (
              <Text style={{ color: PLAYER_THEME.muted, textAlign: "center", marginTop: 40, fontWeight: "600" }}>loading lyrics…</Text>
            ) : lines.length > 0 ? (
              <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 40, paddingBottom: 80 }}>
                {lines.map((l, i) => (
                  <Pressable key={i} onPress={() => l.t < 1e8 && seek(l.t)}>
                    <Text
                      numberOfLines={2}
                      style={{
                        color: i === activeIdx ? PLAYER_THEME.ink : PLAYER_THEME.faint,
                        fontWeight: i === activeIdx ? "900" : "700",
                        fontSize: i === activeIdx ? 23 : 19,
                        textAlign: "center",
                        marginVertical: 6,
                        opacity: l.t > 1e8 ? 0 : 1,
                      }}
                    >
                      {l.text}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : lyrics?.plain ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {lyrics.plain.split("\n").map((l, i) => (
                  <Text key={i} style={{ color: l.trim() ? PLAYER_THEME.ink : "transparent", fontSize: 15, textAlign: "center", marginVertical: 4 }}>
                    {l || "."}
                  </Text>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: PLAYER_THEME.muted, textAlign: "center", marginTop: 40, fontSize: 14, fontWeight: "600" }}>
                no lyrics for this one
              </Text>
            )}
          </View>
        ) : (
          <View style={{ alignSelf: "center", marginTop: 20 }}>
            <View style={[shadow(), { borderRadius: 10 }]}>
              <Cover uri={cover ?? song.cover} size={W - 56} radius={10} />
            </View>
          </View>
        )}

        {/* Track Title, Artist & Like button — Spotify Layout (left aligned with heart on right) */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: showLyrics ? 12 : 24, paddingHorizontal: 4 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text numberOfLines={1} style={{ color: PLAYER_THEME.ink, fontSize: 22, fontWeight: "800" }}>
              {song.name}
            </Text>
            <Text numberOfLines={1} style={{ color: PLAYER_THEME.muted, fontSize: 14, marginTop: 4, fontWeight: "600" }}>
              {artists.join(", ")}
            </Text>
          </View>
          <Pressable onPress={() => toggleLike(song)} hitSlop={10} style={{ padding: 4 }}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={PLAYER_THEME.ink} />
          </Pressable>
        </View>

        {/* Scrubber / Progress Bar */}
        <View style={{ marginTop: 18 }}>
          <View
            onLayout={(e) => { barW.current = e.nativeEvent.layout.width; }}
            {...scrubPan.panHandlers}
            style={{ paddingVertical: 10, position: "relative" }}
          >
            <View style={{ height: 4, borderRadius: 2, backgroundColor: PLAYER_THEME.track, overflow: "hidden" }}>
              <View style={{ width: `${shown * 100}%`, height: "100%", backgroundColor: PLAYER_THEME.ink, borderRadius: 2 }} />
            </View>
            <View
              style={{
                position: "absolute",
                top: 10 + 2 - 6,
                left: `${shown * 100}%`,
                marginLeft: -6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: PLAYER_THEME.thumb,
              }}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ color: PLAYER_THEME.muted, fontSize: 11, fontWeight: "600" }}>{fmt(shown * dur)}</Text>
              <Text style={{ color: PLAYER_THEME.muted, fontSize: 11, fontWeight: "600" }}>{fmt(dur)}</Text>
            </View>
          </View>
        </View>

        {/* Playback Controls — Spotify 5-control row (Shuffle, Prev, Big Play/Pause, Next, Repeat) */}
        <View style={sp.controls}>
          <Pressable onPress={() => setShuffle((v) => !v)} hitSlop={12} style={{ padding: 6 }}>
            <Ionicons name="shuffle" size={24} color={shuffle ? PLAYER_THEME.ink : PLAYER_THEME.faint} />
          </Pressable>

          <Pressable onPress={() => skip(-1)} hitSlop={12} style={{ padding: 6 }}>
            <Ionicons name="play-skip-back" size={28} color={PLAYER_THEME.ink} />
          </Pressable>

          <Pressable
            onPress={toggle}
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              backgroundColor: PLAYER_THEME.btnBg,
              alignItems: "center",
              justifyContent: "center",
              ...shadow(10),
            }}
          >
            <Ionicons name={playing ? "pause" : "play"} size={32} color={PLAYER_THEME.btnInk} />
          </Pressable>

          <Pressable onPress={() => skip(1)} hitSlop={12} style={{ padding: 6 }}>
            <Ionicons name="play-skip-forward" size={28} color={PLAYER_THEME.ink} />
          </Pressable>

          <Pressable onPress={() => setRepeat((v) => !v)} hitSlop={12} style={{ padding: 6 }}>
            <Ionicons name="repeat" size={24} color={repeat ? PLAYER_THEME.ink : PLAYER_THEME.faint} />
          </Pressable>
        </View>

        {!showLyrics && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, paddingHorizontal: 6 }}>
            <Pressable
              onPress={() => !saved && !downBusy && download(song)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: PLAYER_THEME.cardBg,
              }}
            >
              <Ionicons name={saved ? "checkmark-circle" : "cloud-download-outline"} size={16} color={PLAYER_THEME.ink} />
              <Text style={{ color: PLAYER_THEME.ink, fontSize: 12, fontWeight: "700" }}>
                {saved
                  ? "Saved offline"
                  : downBusy
                  ? progress[song.id] > 0
                    ? `Saving ${Math.round(progress[song.id] * 100)}%`
                    : "Saving…"
                  : "Save offline"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowLyrics(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: PLAYER_THEME.cardBg,
              }}
            >
              <Ionicons name="mic-outline" size={16} color={PLAYER_THEME.ink} />
              <Text style={{ color: PLAYER_THEME.ink, fontSize: 12, fontWeight: "700" }}>Lyrics</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  fill: { flex: 1 },
  wrap: { flex: 1, padding: 20, paddingTop: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, marginTop: 10 },
});
