import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, BackHandler, Alert } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "./src/Icon";
import { shadow } from "./src/theme";
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
  { key: "library", off: "albums-outline", on: "albums" },
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
  const { t } = useStore();
  const insets = useSafeAreaInsets();
  const { mini, cover, playing, toggle } = usePlayer();
  const [nav, setNav] = useState({ tab: "home", stack: [] });
  const [full, setFull] = useState(false);
  const [splash, setSplash] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  // known-good translucent glass — the real BlurView path froze/crashed on the test device
  const glass = t.mode === "dark" ? "rgba(18,18,18,0.94)" : "rgba(250,250,250,0.95)";
  const scrim = t.mode === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)";

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

      {mini && !full && (
        <Pressable onPress={() => setFull(true)} style={[st.miniOuter, { bottom: 72 + insets.bottom }]}>
          <View
            style={[
              st.mini,
              { backgroundColor: glass, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: t.hair, ...shadow(12) },
            ]}
          >
            <Cover uri={cover} size={46} radius={8} />
            <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
              <Text numberOfLines={1} style={{ color: t.ink, fontWeight: "700", fontSize: 13.5 }}>{mini.name}</Text>
              <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11 }}>{mini.artists?.[0] ?? ""}</Text>
            </View>
            <Pressable onPress={toggle} hitSlop={8} style={[st.miniPlay, { backgroundColor: t.accent }]}>
              <Ionicons name={playing ? "pause" : "play"} size={17} color={t.onAccent} />
            </Pressable>
          </View>
        </Pressable>
      )}

      <View
        style={[st.tabs, { backgroundColor: glass, paddingBottom: insets.bottom + 6, borderTopWidth: 1, borderTopColor: t.hair }]}
        pointerEvents="box-none"
      >
        {TABS.map((x) => {
          const active = !nav.stack.length && nav.tab === x.key;
          return (
            <Pressable key={x.key} onPress={() => goto(x.key)} style={st.tabHit}>
              <Ionicons name={active ? x.on : x.off} size={24} color={active ? t.ink : t.muted} />
              <Text style={{ fontSize: 10.5, marginTop: 3, fontWeight: "600", color: active ? t.ink : t.muted }}>
                {x.key === "home" ? "Home" : x.key === "search" ? "Search" : "Library"}
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
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100, backgroundColor: t.bg, paddingTop: insets.top + 4 }}>
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
  mini: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingRight: 8, paddingLeft: 6 },
  miniPlay: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  tabs: { flexDirection: "row", paddingTop: 10 },
  tabHit: { flex: 1, alignItems: "center" },
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
