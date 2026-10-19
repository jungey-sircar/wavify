import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { api, coverOf } from "../api";
import { useStore } from "../store";
import { usePlayer } from "../player";
import { Cover, SongRow, Fab, SkeletonHero, SkeletonList } from "../components";

export function Artist({ id, nav }) {
  const { t } = useStore();
  const { play } = usePlayer();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .artist(id)
      .then((r) => alive && setData(r.data))
      .catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, [id]);

  if (err) {
    return (
      <View style={[st.center, { flex: 1 }]}>
        <Text style={{ color: t.muted, fontSize: 14 }}>artist unavailable</Text>
      </View>
    );
  }
  if (!data)
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        <SkeletonHero />
        <View style={{ marginTop: 26 }}>
          <SkeletonList n={5} />
        </View>
      </ScrollView>
    );

  const top = data?.topSongs?.slice(0, 10) ?? [];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 170 }}>
      <View style={{ alignItems: "center", paddingTop: 18, paddingHorizontal: 20 }}>
        <Cover uri={coverOf(data)} size={130} radius={65} />
        <Text style={{ color: t.ink, fontSize: 28, fontWeight: "900", marginTop: 16, textAlign: "center" }}>{data?.name}</Text>
        <Text numberOfLines={1} style={{ color: t.muted, fontSize: 13, marginTop: 6 }}>
          {data?.followerCount ? `${Number(data.followerCount).toLocaleString("en-US")} followers` : "Artist"}
        </Text>
        <View style={{ marginTop: 16 }}>
          <Fab icon="play" onPress={() => top[0] && play(top[0], top)} />
        </View>
      </View>

      {top.length > 0 && (
        <View style={{ marginTop: 26 }}>
          <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800", paddingHorizontal: 16, marginBottom: 6 }}>Top songs</Text>
          {top.map((s, i) => (
            <SongRow key={s.id + i} song={s} list={top} num={i + 1} />
          ))}
        </View>
      )}

      {data?.albums?.length > 0 && (
        <View style={{ marginTop: 26 }}>
          <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800", paddingHorizontal: 16, marginBottom: 12 }}>Albums</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {data.albums.slice(0, 12).map((a) => (
              <Pressable key={a.id} onPress={() => nav.push("detail", { type: "album", id: a.id, title: a.name })} style={{ width: 128 }}>
                <Cover uri={coverOf(a)} size={128} radius={12} />
                <Text numberOfLines={1} style={{ color: t.ink, fontSize: 13, fontWeight: "700", marginTop: 8 }}>{a.name}</Text>
                <Text numberOfLines={1} style={{ color: t.muted, fontSize: 11.5, marginTop: 1 }}>{a.year ?? ""}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({ center: { alignItems: "center", justifyContent: "center" } });
