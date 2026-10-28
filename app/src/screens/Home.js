import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "../Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, coverOf, artistsOf } from "../api";
import { useStore } from "../store";
import { usePlayer } from "../player";
import { Cover, Shelf, Skeleton, SkeletonCards, SkeletonList } from "../components";

const CARDS = [
  { q: "trending", title: "Trending now" },
  { q: "top", title: "Top hits" },
  { q: "top telugu", title: "Telugu heat" },
  { q: "top tamil", title: "Tamil heat" },
  { q: "punjabi hits", title: "Punjabi heat" },
];
const CACHE_KEY = "wave.homeCache";

export function Home({ nav, goToCollection }) {
  const { t, recent } = useStore();
  const { play } = usePlayer();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [rows, setRows] = useState(null); // null = not hydrated from cache yet
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = (done) =>
    Promise.allSettled(CARDS.map((s) => api.search(s.q))).then((res) => {
      const map = {};
      res.forEach((r, i) => (map[CARDS[i].q] = r.status === "fulfilled" ? r.value?.data?.songs ?? [] : []));
      setRows(map);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), shelves: map })).catch(() => {});
      done && done();
    });

  useEffect(() => {
    // hydrate instantly from cache, then refresh silently
    AsyncStorage.getItem(CACHE_KEY)
      .then((v) => {
        if (v) {
          try {
            setRows(JSON.parse(v)?.shelves ?? {});
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shortcut = (recent.length ? recent : (rows?.["top"] ?? [])).filter((s) => s && s.id).slice(0, 4);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: 170 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => fetchAll(() => setRefreshing(false))} />}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
        <Text style={{ color: t.ink, fontSize: 26, fontWeight: "800" }}>{greet}</Text>
        <Pressable onPress={() => nav.push("settings", { title: "Settings" })} hitSlop={10} style={{ padding: 8 }}>
          <Ionicons name="settings-outline" size={23} color={t.ink} />
        </Pressable>
      </View>

      {rows === null ? (
        <>
          <View style={{ paddingHorizontal: 16, marginTop: 16, flexDirection: "row", gap: 8 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} w="49%" h={56} r={8} />)}
          </View>
          <View style={{ marginTop: 30 }}><SkeletonCards n={3} /></View>
          <View style={{ marginTop: 28 }}><SkeletonList n={4} /></View>
        </>
      ) : (
        <>
          {shortcut.length > 0 && (
            <View style={{ marginTop: 14, paddingHorizontal: 16, gap: 8 }}>
              {[0, 1].map((rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                  {shortcut.slice(rowIdx * 2, rowIdx * 2 + 2).map((s) => (
                    <Pressable
                      key={s.id + rowIdx}
                      onPress={() => play(s, shortcut)}
                      style={[st.tile, { backgroundColor: t.sunk, borderRadius: 8, overflow: "hidden" }]}
                    >
                      <Cover uri={s.cover ?? coverOf(s)} size={56} radius={0} />
                      <Text numberOfLines={1} style={{ color: t.ink, fontSize: 12.5, fontWeight: "700", flex: 1, paddingHorizontal: 10 }}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}

          {CARDS.map((s) => {
            const list = (rows[s.q] ?? []).filter((x) => x && x.id);
            if (!list.length) return null;
            return (
              <Shelf key={s.q} title={s.title} onSeeAll={() => goToCollection(s.q, s.title)}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {list.slice(0, 12).map((song) => (
                    <Pressable key={song.id} onPress={() => play(song, list)} style={{ width: 132 }}>
                      <Cover uri={coverOf(song)} size={132} radius={12} />
                      <Text numberOfLines={1} style={{ color: t.ink, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{song.name}</Text>
                      <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11.5, marginTop: 2 }}>{artistsOf(song)[0] ?? ""}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Shelf>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  tile: { flex: 1, flexDirection: "row", alignItems: "center", height: 56 },
});
