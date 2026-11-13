import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "../Icon";
import { useStore } from "../store";
import { SongRow, IconBtn } from "../components";

const TABS = [
  { key: "LIKED", label: "Liked Songs" },
  { key: "HISTORY", label: "History" },
  { key: "DOWNLOADS", label: "Downloads" },
];

export function Library({ nav }) {
  const { t, liked, recent, downloads, removeDownload } = useStore();
  const [tab, setTab] = useState("LIKED");

  const dlList = Object.values(downloads);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person" size={16} color={t.onAccent} />
          </View>
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: "800" }}>Your Library</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <IconBtn name="settings-outline" color={t.ink} onPress={() => nav.push("settings", { title: "Settings" })} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "flex-start" }}
      >
        {TABS.map((x) => (
          <Pressable
            key={x.key}
            onPress={() => setTab(x.key)}
            hitSlop={6}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: tab === x.key ? t.ink : t.sunk,
            }}
          >
            <Text style={{ color: tab === x.key ? (t.mode === "dark" ? "#121212" : "#FFFFFF") : t.ink, fontSize: 13, fontWeight: "700" }}>
              {x.label}{x.key === "DOWNLOADS" && dlList.length ? ` · ${dlList.length}` : ""}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1, marginTop: 14 }} contentContainerStyle={{ paddingBottom: 170 }}>
        {/* Pinned Liked Songs tile — Spotify signature */}
        {tab === "LIKED" && (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 10,
                borderRadius: 8,
                backgroundColor: t.panel,
                borderWidth: 1,
                borderColor: t.hair,
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 6,
                  backgroundColor: "#492299",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="heart" size={26} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ color: t.ink, fontSize: 15, fontWeight: "800" }}>Liked Songs</Text>
                <Text style={{ color: t.muted, fontSize: 12, marginTop: 3 }}>
                  Playlist • {liked.length} {liked.length === 1 ? "song" : "songs"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {tab === "LIKED" && (
          liked.length ? liked.map((s) => <SongRow key={s.id} song={s} list={liked} subtitle={s.artists?.join(", ") ?? ""} />) : <Empty t={t} note="Nothing hearted yet — tap the heart on any track to add it here" />
        )}
        {tab === "HISTORY" && (
          recent.length ? recent.map((s) => <SongRow key={s.id} song={s} list={recent} subtitle={s.artists?.join(", ") ?? ""} />) : <Empty t={t} note="Your listening history will appear here as you play songs" />
        )}
        {tab === "DOWNLOADS" && (
          dlList.length ? (
            dlList.map((s) => (
              <View key={s.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <SongRow song={s} list={dlList} subtitle={`${s.artists?.[0] ?? ""} · saved`} />
                </View>
                <IconBtn name="trash-outline" size={20} color={t.muted} onPress={() => removeDownload(s.id)} />
              </View>
            ))
          ) : (
            <Empty t={t} note="No saved tracks yet — save tracks to listen offline" />
          )
        )}
        {tab === "DOWNLOADS" && dlList.length > 0 && (
          <Text style={{ color: t.faint, fontSize: 11, textAlign: "center", marginTop: 18 }}>saved tracks play fully offline · 160kbps</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Empty({ t, note }) {
  return (
    <View style={st.empty}>
      <Ionicons name="trail-sign" size={38} color={t.faint} />
      <Text style={{ color: t.muted, fontSize: 14, marginTop: 12, textAlign: "center", paddingHorizontal: 40 }}>{note}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  empty: { alignItems: "center", marginTop: 70 },
});
