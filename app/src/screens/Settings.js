import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Switch, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCENTS } from "../theme";
import { useStore } from "../store";
import { BASE } from "../api";

const QUALITIES = [
  { id: 2, label: "Low · 96kbps" },
  { id: 3, label: "Medium · 160kbps" },
  { id: 4, label: "High · 320kbps" },
];

function Section({ title, children }) {
  const { t } = useStore();
  return (
    <View style={{ marginTop: 26 }}>
      <Text style={{ color: t.faint, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.6, paddingHorizontal: 4, marginBottom: 10 }}>{title}</Text>
      <View style={{ backgroundColor: t.panel, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: t.hair }}>{children}</View>
    </View>
  );
}

function Row({ children, hint }) {
  const { t } = useStore();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.hair }}>
      {children}
      {hint ? <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 4 }}>{hint}</Text> : null}
    </View>
  );
}

export function Settings() {
  const { t, mode, toggleTheme, accent, setAccent, quality, setQuality, anim, setAnim, searches, recent, liked, downloads, clearSearches, clearRecent } = useStore();
  const [homeCacheAt, setHomeCacheAt] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("wave.homeCache")
      .then((v) => {
        if (v) {
          try {
            setHomeCacheAt(JSON.parse(v).savedAt ?? null);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const clearHomeCache = () => {
    AsyncStorage.removeItem("wave.homeCache").catch(() => {});
    setHomeCacheAt(null);
    Alert.alert("Home cache cleared", "Pull to refresh on Home to refill it.");
  };

  const resetAll = () => {
    Alert.alert("Reset everything?", "This wipes likes, history, searches, saves and files. Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          ["wave.recent", "wave.liked", "wave.searches", "wave.downloads", "wave.homeCache", "wave.quality", "wave.anim", "wave.accent", "wave.mode"].forEach((k) => AsyncStorage.removeItem(k).catch(() => {}));
          setTimeout(() => Alert.alert("Done", "Restart the app (shake → Reload) for a clean slate."), 300);
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 16, paddingTop: 6 }}>
      <Section title="APPEARANCE">
        <Row>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {["dark", "light"].map((m) => (
              <Pressable
                key={m}
                onPress={() => mode !== m && toggleTheme()}
                style={{ flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", backgroundColor: mode === m ? t.sunk : t.glass }}
              >
                <Text style={{ color: mode === m ? t.ink : t.muted, fontSize: 13.5, fontWeight: "700", textTransform: "capitalize" }}>{m}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {ACCENTS.map((a) => (
              <Pressable key={a.id} onPress={() => setAccent(a.id)} style={{ width: 48, alignItems: "center" }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: a.hex, borderWidth: accent === a.id ? 3 : 0, borderColor: t.ink, alignItems: "center", justifyContent: "center" }}>
                  {accent === a.id ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                </View>
                <Text numberOfLines={1} style={{ color: accent === a.id ? t.ink : t.muted, fontSize: 10.5, fontWeight: "600", marginTop: 5 }}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
      </Section>

      <Section title="PLAYBACK">
        <Row hint="Applies to newly saved tracks.">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {QUALITIES.map((q) => (
              <Pressable
                key={q.id}
                onPress={() => setQuality(q.id)}
                style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: quality === q.id ? t.accent : t.sunk }}
              >
                <Text style={{ color: quality === q.id ? t.onAccent : t.muted, fontSize: 12.5, fontWeight: "700" }}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </Row>
      </Section>

      <Section title="ANIMATIONS">
        <Row>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Player animations</Text>
              <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 3 }}>Entrance motion and lyric scrolling</Text>
            </View>
            <Switch value={anim} onValueChange={setAnim} trackColor={{ true: t.accent, false: t.sunk }} thumbColor="#FFFFFF" />
          </View>
        </Row>
      </Section>

      <Section title="CACHE & DATA">
        <Row>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Search history</Text>
              <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 3 }}>{searches.length} saved searches</Text>
            </View>
            <Pressable onPress={clearSearches} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.sunk }}>
              <Text style={{ color: t.muted, fontSize: 12.5, fontWeight: "700" }}>Clear</Text>
            </Pressable>
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Listening history</Text>
              <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 3 }}>{recent.length} played tracks · {liked.length} hearted</Text>
            </View>
            <Pressable onPress={clearRecent} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.sunk }}>
              <Text style={{ color: t.muted, fontSize: 12.5, fontWeight: "700" }}>Clear</Text>
            </Pressable>
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Home cache</Text>
              <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 3 }}>
                {homeCacheAt ? `saved ${typeof homeCacheAt === "number" ? new Date(homeCacheAt).toLocaleString() : "earlier"}` : "empty"}
              </Text>
            </View>
            <Pressable onPress={clearHomeCache} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.sunk }}>
              <Text style={{ color: t.muted, fontSize: 12.5, fontWeight: "700" }}>Clear</Text>
            </Pressable>
          </View>
        </Row>
        <Row>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Saved tracks</Text>
              <Text style={{ color: t.faint, fontSize: 11.5, marginTop: 3 }}>{Object.keys(downloads ?? {}).length} on device</Text>
            </View>
            <Ionicons name="download-outline" size={20} color={t.faint} />
          </View>
        </Row>
        <Row>
          <Pressable onPress={resetAll} style={{ alignSelf: "flex-start" }}>
            <Text style={{ color: t.accent, fontSize: 14, fontWeight: "800" }}>Reset all app data</Text>
          </Pressable>
        </Row>
      </Section>

      <Section title="ABOUT">
        <Row hint={BASE}>
          <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700" }}>Wavify 1.0</Text>
        </Row>
      </Section>
    </ScrollView>
  );
}
