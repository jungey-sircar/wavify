import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { api, coverOf, artistsOf } from "../api";
import { useStore } from "../store";
import { usePlayer } from "../player";
import { Cover, SongRow, Fab, SkeletonHero, SkeletonList } from "../components";

export function Detail({ type, id }) {
  const { t } = useStore();
  const { play } = usePlayer();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!id) return;
    if (type === "album") {
      api.album(id).then((r) => alive && setData(r.data)).catch(() => alive && setErr(true));
    } else {
      api.playlist(id).then((r) => alive && setData(r.data)).catch(() => alive && setErr(true));
    }
    return () => { alive = false; };
  }, [type, id]);

  if (err) {
    return (
      <View style={[st.center, { flex: 1 }]}>
        <Text style={{ color: t.muted, fontSize: 14 }}>{type} unavailable</Text>
      </View>
    );
  }
  if (!data)
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        <SkeletonHero />
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SkeletonList n={5} />
        </View>
      </ScrollView>
    );

  const list = data?.songs ?? [];
  const names = artistsOf(data).join(", ");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 170 }}>
      <View style={{ alignItems: "center", paddingTop: 16, paddingHorizontal: 20 }}>
        <Cover uri={coverOf(data)} size={200} radius={16} />
        <Text style={{ color: t.muted, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginTop: 16 }}>{type === "album" ? "ALBUM" : "PLAYLIST"}</Text>
        <Text style={{ color: t.ink, fontSize: 24, fontWeight: "900", marginTop: 4, textAlign: "center" }}>{data?.name}</Text>
        <Text numberOfLines={1} style={{ color: t.muted, fontSize: 13, marginTop: 6, textAlign: "center" }}>{names || "Mix"}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
        <Fab icon="play" onPress={() => list[0] && play(list[0], list)} />
      </View>

      <View style={{ marginTop: 22 }}>
        {list.map((s, i) => (
          <SongRow key={s.id + i} song={s} list={list} num={i + 1} />
        ))}
        {!list.length && <Text style={{ color: t.muted, textAlign: "center", marginTop: 40 }}>empty</Text>}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
