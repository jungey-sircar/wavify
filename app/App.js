import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, BackHandler, Alert } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "./src/Icon";
import { shadow, PLAYER_THEME } from "./src/theme";
import { StoreProvider, useStore } from "./src/store";
import { PlayerProvider, usePlayer } from "./src/player";
import { Home } from "./src/screens/Home";
import { Collection } from "./src/screens/Collection";
import { Artist } from "./src/screens/Artist";
import { Detail } from "./src/screens/Detail";
import { Library } from "./src/screens/Library";
import { NowPlaying } from "./src/screens/NowPlaying";
import { Settings } from "./src/screens/Settings";
import { Splash } from "./src/Splash";
import { Cover } from "./src/components";

const TABS = [
  { key: "home", off: "home-outline", on: "home" },
  { key: "search", off: "search-outline", on: "search" },
  { key: "library", off: "library-outline", on: "library" },
];

// on-device crash reporter: surfaces the real error on screen (no adb needed)
if (global.ErrorUtils?.setGlobalHandler) {
  const orig = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((e, isFatal) => {
    const msg = `${e?.message ?? String(e)}`;
    const stack = (e?.stack ?? "").split("\n").slice(0, 6).join("\n");
    console.warn("wavify-crash", isFatal, msg, stack);
    Alert.alert(isFatal ? "Wavify error" : "Wavify warning", `${msg}\n\n${stack}`.slice(0, 700));
    orig?.(e, isFatal);
  }, true);
}

function Shell() {
  const { t, isLiked, toggleLike } = useStore();
  const insets = useSafeAreaInsets();
  const { mini, cover, playing, toggle, position, duration, skip } = usePlayer();
  const [nav, setNav] = useState({ tab: "home", stack: [] });
  const [full, setFull] = useState(false);
  const [splash, setSplash] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  const glass = t.mode === "dark" ? "rgba(18,18,18,0.96)" : "rgba(250,250,250,0.96)";
  const scrim = t.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)";

  const push = (screen, params) => setNav((n) => ({ ...n, stack: [...n.stack, { screen, params }] }));
  const pop = () => setNav((n) => ({ ...n, stack: n.stack.slice(0, -1) }));
  const goto = (tab) => setNav({ tab, stack: [] });
  const navApi = { push, pop, goto };

  // Android hardware back: NowPlaying → close; stack → pop; tab → go home; root → exit prompt
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (splash) return true;
      if (exitOpen) {
        setExitOpen(false);
        return true;
      }
      if (full) {
        setFull(false);
        return true;
      }
      if (nav.stack.length) {
        setNav((n) => ({ ...n, stack: n.stack.slice(0, -1) }));
        return true;
      }
      if (nav.tab !== "home") {
        setNav({ tab: "home", stack: [] });
        return true;
      }
      setExitOpen(true);
      return true;
    });
    return () => sub.remove();
  }, [nav, full, splash, exitOpen]);

  const top = nav.stack[nav.stack.length - 1];
  let body;
  if (top?.screen === "artist") body = <Artist {...top.params} nav={navApi} />;
  else if (top?.screen === "detail") body = <Detail {...top.params} nav={navApi} />;
  else if (top?.screen === "collection") body = <Collection initialQuery={top.params.q} title={top.params.title} nav={navApi} />;
  else if (top?.screen === "settings") body = <Settings {...top.params} nav={navApi} />;
  else if (nav.tab === "search") body = <Collection initialQuery="" title="Search" nav={navApi} />;
  else if (nav.tab === "library") body = <Library nav={navApi} />;
  else body = <Home nav={navApi} goToCollection={(q, title) => push("collection", { q, title })} />;

  const dur = duration || mini?.duration || 0;
  const progressRatio = dur > 0 ? Math.min(1, Math.max(0, position / dur)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />

      {/* back row lives INSIDE the inset padding — never under the status bar */}
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {top && (
          <Pressable onPress={pop} style={st.backRow} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={t.ink} />
            <Text numberOfLines={1} style={{ color: t.muted, fontSize: 13, fontWeight: "600" }}>
              {top.params?.title ?? "Back"}
            </Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>{body}</View>
      </View>

      {/* When a song is chosen, the player is rendered in opaque light blue */}
      {mini && !full && (
        <Pressable onPress={() => setFull(true)} style={[st.miniOuter, { bottom: 62 + insets.bottom }]}>
          <View
            style={[
              st.mini,
              {
                backgroundColor: PLAYER_THEME.bg,
                borderRadius: 8,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: PLAYER_THEME.hair,
                ...shadow(14),
              },
            ]}
          >
            <Cover uri={cover} size={42} radius={6} />
            <View style={{ flex: 1, marginLeft: 10, marginRight: 6, justifyContent: "center" }}>
              <Text numberOfLines={1} style={{ color: PLAYER_THEME.ink, fontWeight: "700", fontSize: 13.5 }}>
                {mini.name}
              </Text>
              <Text numberOfLines={1} style={{ color: PLAYER_THEME.muted, fontSize: 11.5, fontWeight: "600", marginTop: 2 }}>
                {mini.artists?.[0] ?? ""}
              </Text>
            </View>

            <Pressable onPress={() => toggleLike(mini)} hitSlop={10} style={{ padding: 6, marginRight: 2 }}>
              <Ionicons
                name={isLiked(mini.id) ? "heart" : "heart-outline"}
                size={21}
                color={isLiked(mini.id) ? PLAYER_THEME.ink : PLAYER_THEME.muted}
              />
            </Pressable>

            <Pressable onPress={toggle} hitSlop={8} style={[st.miniPlay, { backgroundColor: PLAYER_THEME.btnBg }]}>
              <Ionicons name={playing ? "pause" : "play"} size={16} color={PLAYER_THEME.btnInk} />
            </Pressable>

            <Pressable onPress={() => skip(1)} hitSlop={8} style={{ padding: 6, marginLeft: 2 }}>
              <Ionicons name="play-skip-forward" size={19} color={PLAYER_THEME.ink} />
            </Pressable>

            {/* Live progress line at bottom of player */}
            <View style={st.miniProgressTrack}>
              <View style={[st.miniProgressBar, { width: `${progressRatio * 100}%` }]} />
            </View>
          </View>
        </Pressable>
      )}

      {/* Bottom tabs — Spotify style */}
      <View
        style={[
          st.tabs,
          {
            backgroundColor: t.mode === "dark" ? "#121212" : "#FFFFFF",
            paddingBottom: insets.bottom + 8,
            borderTopWidth: 1,
            borderTopColor: t.hair,
          },
        ]}
        pointerEvents="box-none"
      >
        {TABS.map((x) => {
          const active = !nav.stack.length && nav.tab === x.key;
          return (
            <Pressable key={x.key} onPress={() => goto(x.key)} style={st.tabHit}>
              <Ionicons name={active ? x.on : x.off} size={24} color={active ? t.ink : t.muted} />
              <Text
                style={{
                  fontSize: 10.5,
                  marginTop: 3,
                  fontWeight: active ? "700" : "500",
                  color: active ? t.ink : t.muted,
                }}
              >
                {x.key === "home" ? "Home" : x.key === "search" ? "Search" : "Your Library"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {exitOpen && !splash && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, elevation: 150 }}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]} onPress={() => setExitOpen(false)} />
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 30 }} pointerEvents="box-none">
            <View style={{ width: "100%", maxWidth: 320, borderRadius: 22, backgroundColor: t.panel, borderWidth: 1, borderColor: t.hair, padding: 22 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.sunk, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Ionicons name="log-out-outline" size={22} color={t.accent} />
              </View>
              <Text style={{ color: t.ink, fontSize: 18.5, fontWeight: "800" }}>Exit Wavify?</Text>
              <Text style={{ color: t.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>Playback will stop and the app will close.</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                <Pressable onPress={() => setExitOpen(false)} style={[st.exitBtn, { backgroundColor: t.sunk }]}>
                  <Text style={{ color: t.ink, fontWeight: "700", fontSize: 14 }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => BackHandler.exitApp()} style={[st.exitBtn, { backgroundColor: t.accent }]}>
                  <Text style={{ color: t.onAccent, fontWeight: "700", fontSize: 14 }}>Exit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}

      {full && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            elevation: 100,
            backgroundColor: PLAYER_THEME.bg,
            paddingTop: insets.top + 4,
          }}
        >
          <NowPlaying onClose={() => setFull(false)} insets={insets} />
        </View>
      )}

      {splash && <Splash onDone={() => setSplash(false)} />}
    </View>
  );
}

const st = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  miniOuter: { position: "absolute", left: 8, right: 8 },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 8,
    position: "relative",
  },
  miniPlay: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
  },
  miniProgressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: PLAYER_THEME.track,
  },
  miniProgressBar: {
    height: "100%",
    backgroundColor: PLAYER_THEME.ink,
  },
  tabs: { flexDirection: "row", paddingTop: 8, height: 60 },
  tabHit: { flex: 1, alignItems: "center", justifyContent: "center" },
  exitBtn: { flex: 1, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <PlayerProvider>
          <Shell />
        </PlayerProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
