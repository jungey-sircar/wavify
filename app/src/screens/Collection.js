import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "../Icon";
import { api, coverOf, artistsOf } from "../api";
import { useStore } from "../store";
import { Cover, SongRow, Shelf, IconBtn, SkeletonList } from "../components";

export function Collection({ initialQuery, title, nav }) {
  const { t, searches, pushSearch, removeSearch, clearSearches } = useStore();
  const [text, setText] = useState(initialQuery ?? "");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const run = useCallback(
    (q) => {
      if (!q.trim()) {
        setRes(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      pushSearch(q.trim());
      api
        .search(q.trim())
        .then((r) => setRes(r.data))
        .catch(() => setRes(null))
        .finally(() => setLoading(false));
    },
    [pushSearch]
  );

  useEffect(() => {
    const q = initialQuery ?? "";
    setText(q);
    if (q.trim()) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const onChange = (v) => {
    setText(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 350);
  };
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const songs = res?.songs ?? [];
  const albums = res?.albums ?? [];
  const artists = res?.artists ?? [];
  const playlists = res?.playlists ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        {title && title !== "Search" ? (
          <Text style={{ color: t.ink, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>{title}</Text>
        ) : null}
        <View style={[st.search, { backgroundColor: t.sunk }]}>
          <Ionicons name="search" size={17} color={t.faint} />
          <TextInput
            value={text}
            onChangeText={onChange}
            placeholder="What do you want to listen to?"
            placeholderTextColor={t.faint}
            style={{ flex: 1, color: t.ink, fontSize: 15, marginLeft: 10, fontWeight: "500" }}
            returnKeyType="search"
            onSubmitEditing={() => run(text)}
          />
          {text ? (
            <Pressable onPress={() => { setText(""); onChange(""); }} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={t.faint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={{ marginTop: 10 }}>
          <SkeletonList n={6} />
        </View>
      ) : !res ? (
        <View style={{ marginTop: 20 }}>
          {searches.length > 0 && (
            <>
              <Text style={{ color: t.ink, fontSize: 18, fontWeight: "800", paddingHorizontal: 16 }}>Recent searches</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12, flexGrow: 0 }}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "flex-start" }}
              >
                {searches.map((s) => (
                  <View key={s} style={{ flexDirection: "row", alignItems: "center", backgroundColor: t.sunk, borderRadius: 18, paddingLeft: 14, paddingRight: 6, paddingVertical: 7 }}>
                    <Pressable onPress={() => { setText(s); run(s); }} hitSlop={6}>
                      <Text style={{ color: t.ink, fontSize: 13, fontWeight: "600" }}>{s}</Text>
                    </Pressable>
                    <Pressable onPress={() => removeSearch(s)} hitSlop={10} style={{ marginLeft: 6, padding: 2 }}>
                      <Ionicons name="close" size={15} color={t.faint} />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={clearSearches} style={{ justifyContent: "center", paddingHorizontal: 10 }}>
                  <Text style={{ color: t.faint, fontSize: 12, fontWeight: "700" }}>Clear all</Text>
                </Pressable>
              </ScrollView>
            </>
          )}
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Ionicons name="search" size={40} color={t.faint} />
            <Text style={{ color: t.muted, fontSize: 14, marginTop: 12, paddingHorizontal: 40, textAlign: "center" }}>
              search any song, singer, album or playlist
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 170 }}>
          {songs.length > 0 && (
            <Shelf title="Songs">
              <View>{songs.slice(0, 6).map((s) => <SongRow key={s.id} song={s} list={songs} />)}</View>
            </Shelf>
          )}
          {artists.length > 0 && (
            <Shelf title="Artists">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                {artists.slice(0, 12).map((a) => (
                  <Pressable key={a.id} onPress={() => nav.push("artist", { id: a.id, title: a.name })} style={{ alignItems: "center", width: 100 }}>
                    <Cover uri={coverOf(a)} size={92} radius={46} />
                    <Text numberOfLines={1} style={{ color: t.ink, fontSize: 12.5, fontWeight: "600", marginTop: 8 }}>{a.name}</Text>
                    <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11, marginTop: 1 }}>Artist</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Shelf>
          )}
          {albums.length > 0 && (
            <Shelf title="Albums">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {albums.slice(0, 12).map((a) => (
                  <Pressable key={a.id} onPress={() => nav.push("detail", { type: "album", id: a.id, title: a.name })} style={{ width: 128 }}>
                    <Cover uri={coverOf(a)} size={128} radius={12} />
                    <Text numberOfLines={1} style={{ color: t.ink, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{a.name}</Text>
                    <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11.5, marginTop: 1 }}>{a.year ?? ""}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Shelf>
          )}
          {playlists.length > 0 && (
            <Shelf title="Playlists">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {playlists.slice(0, 12).map((p) => (
                  <Pressable key={p.id} onPress={() => nav.push("detail", { type: "playlist", id: p.id, title: p.name })} style={{ width: 128 }}>
                    <Cover uri={coverOf(p)} size={128} radius={12} />
                    <Text numberOfLines={1} style={{ color: t.ink, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{p.name}</Text>
                    <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11.5, marginTop: 1 }}>{artistsOf(p)?.[0] ?? "Playlist"}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Shelf>
          )}
          {songs.length + albums.length + artists.length + playlists.length === 0 && (
            <Text style={{ color: t.muted, textAlign: "center", marginTop: 60, fontSize: 14 }}>nothing found - try another word</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", letterSpacing: 0, height: 46, borderRadius: 23, paddingHorizontal: 16 },
});
