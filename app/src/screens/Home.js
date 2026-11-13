import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from "react-native";
import { Ionicons } from "../Icon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, coverOf, artistsOf } from "../api";
import { useStore } from "../store";
import { usePlayer } from "../player";
import { Cover, Shelf, Skeleton, SkeletonCards, SkeletonList, Chip } from "../components";

const SHELVES = [
  { q: "trending", title: "Trending now" },
  { q: "top hits", title: "Today's biggest hits" },
  { q: "popular artists", title: "Popular artists", isArtist: true },
  { q: "top telugu", title: "Telugu heat" },
  { q: "top tamil", title: "Tamil heat" },
  { q: "punjabi hits", title: "Punjabi heat" },
];
const CACHE_KEY = "wave.homeCache";
const CACHE_TTL = 6 * 60 * 60 * 1000;

export function Home({ nav, goToCollection }) {
  const { t, recent } = useStore();
  const { play, mini, playing } = usePlayer();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [activeChip, setActiveChip] = useState("All");
  const [rows, setRows] = useState(null); // null = not hydrated from cache yet
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = (done) =>
    Promise.allSettled(SHELVES.map((s) => api.search(s.q))).then((res) => {
      const map = {};
      res.forEach((r, i) => (map[SHELVES[i].q] = r.status === "fulfilled" ? r.value?.data?.songs ?? [] : []));
      const hasData = Object.values(map).some((s) => s.length > 0);
      if (hasData) {
        setRows(map);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), shelves: map })).catch(() => {});
      }
      done && done();
    });

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY)
      .then((v) => {
        if (v) {
          try {
            const cached = JSON.parse(v);
            if (cached?.shelves && Date.now() - (cached.savedAt ?? 0) <= CACHE_TTL) {
              setRows(cached.shelves);
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => fetchAll());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shortcut = (recent.length ? recent : (rows?.["top hits"] ?? rows?.["trending"] ?? [])).filter((s) => s && s.id).slice(0, 6);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: 170 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={t.accent} onRefresh={() => fetchAll(() => setRefreshing(false))} />}
    >
      {/* Top Header — Spotify Style */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: t.onAccent, fontSize: 14, fontWeight: "900" }}>W</Text>
          </View>
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: "800" }}>{greet}</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable onPress={() => nav.push("settings", { title: "Settings" })} hitSlop={10} style={{ padding: 8 }}>
            <Ionicons name="settings-outline" size={22} color={t.ink} />
          </Pressable>
        </View>
      </View>

      {/* Filter Chips — Spotify style ("All", "Music", "Podcasts") */}
      <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 14 }}>
        {["All", "Music", "Podcasts"].map((c) => (
          <Chip key={c} active={activeChip === c} onPress={() => setActiveChip(c)}>
            {c}
          </Chip>
        ))}
      </View>

      {rows === null ? (
        <>
          <View style={{ paddingHorizontal: 16, marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} w="48%" h={56} r={6} />)}
          </View>
          <View style={{ marginTop: 30 }}><SkeletonCards n={3} /></View>
          <View style={{ marginTop: 28 }}><SkeletonList n={4} /></View>
        </>
      ) : (
        <>
          {/* 6-Item Quick Play Grid — Spotify Hallmark */}
          {shortcut.length > 0 && (
            <View style={{ marginTop: 14, paddingHorizontal: 16, gap: 8 }}>
              {[0, 1, 2].map((rowIdx) => {
                const pair = shortcut.slice(rowIdx * 2, rowIdx * 2 + 2);
                if (!pair.length) return null;
                return (
                  <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                    {pair.map((s) => {
                      const isPlayingThis = mini?.id === s.id && playing;
                      return (
                        <Pressable
                          key={s.id + rowIdx}
                          onPress={() => play(s, shortcut)}
                          style={[st.tile, { backgroundColor: t.sunk, borderRadius: 6, overflow: "hidden" }]}
                        >
                          <Cover uri={s.cover ?? coverOf(s)} size={56} radius={0} />
                          <Text numberOfLines={2} style={{ color: t.ink, fontSize: 12.5, fontWeight: "700", flex: 1, paddingHorizontal: 8 }}>
                            {s.name}
                          </Text>
                          {isPlayingThis ? (
                            <View style={{ paddingRight: 10 }}>
                              <Ionicons name="volume-high" size={17} color={t.accent} />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* Shelves */}
          {SHELVES.map((s) => {
            const list = (rows[s.q] ?? []).filter((x) => x && x.id);
            if (!list.length) return null;
            return (
              <Shelf key={s.q} title={s.title} onSeeAll={() => goToCollection(s.q, s.title)}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                  {list.slice(0, 12).map((song) => {
                    const isRound = s.isArtist;
                    return (
                      <Pressable key={song.id} onPress={() => play(song, list)} style={{ width: 136 }}>
                        <Cover uri={coverOf(song)} size={136} radius={isRound ? 68 : 6} />
                        <Text numberOfLines={1} style={{ color: t.ink, fontSize: 13, fontWeight: "700", marginTop: 8 }}>
                          {song.name}
                        </Text>
                        <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11.5, marginTop: 2 }}>
                          {isRound ? "Artist" : (artistsOf(song)[0] ?? "")}
                        </Text>
                      </Pressable>
                    );
                  })}
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
