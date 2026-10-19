import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../store";
import { SongRow, IconBtn } from "../components";

const TABS = [
  { key: "LIKED", label: "Liked" },
  { key: "HISTORY", label: "History" },
  { key: "DOWNLOADS", label: "Downloads" },
];

export function Library({ nav }) {
  const { t, liked, recent, downloads, removeDownload } = useStore();
  const [tab, setTab] = useState("LIKED");

  const dlList = Object.values(downloads);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ color: t.ink, fontSize: 26, fontWeight: "800" }}>Your Library</Text>
        <IconBtn name="settings-outline" color={t.ink} onPress={() => nav.push("settings", { title: "Settings" })} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, alignItems: "flex-start" }}
      >
        {TABS.map((x) => (
          <Pressable
            key={x.key}
            onPress={() => setTab(x.key)}
            hitSlop={6}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: tab === x.key ? t.accent : t.sunk,
            }}
          >
            <Text style={{ color: tab === x.key ? t.onAccent : t.ink, fontSize: 13, fontWeight: "600" }}>
              {x.label}{x.key === "DOWNLOADS" && dlList.length ? ` · ${dlList.length}` : ""}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1, marginTop: 16 }} contentContainerStyle={{ paddingBottom: 170 }}>
        {tab === "LIKED" && (
          liked.length ? liked.map((s) => <SongRow key={s.id} song={s} list={liked} subtitle={s.artists?.join(", ") ?? ""} />) : <Empty t={t} note="nothing hearted yet — tap the heart on any track" />
        )}
        {tab === "HISTORY" && (
          recent.length ? recent.map((s) => <SongRow key={s.id} song={s} list={recent} subtitle={s.artists?.join(", ") ?? ""} />) : <Empty t={t} note="history fills up as you listen" />
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
            <Empty t={t} note="no saved tracks yet — use the save button on any track" />
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
