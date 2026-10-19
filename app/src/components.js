import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "./store";
import { usePlayer } from "./player";
import { coverOf, artistsOf } from "./api";
import { ACCENTS } from "./theme";

export function Cover({ uri, size, radius = 10 }) {
  const { t } = useStore();
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden", backgroundColor: t.sunk }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="musical-notes" size={Math.round(size * 0.34)} color={t.faint} />
        </View>
      )}
    </View>
  );
}

export function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  const { t } = useStore();
  const op = useRef(new Animated.Value(0.42)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 620, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.42, duration: 620, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: t.sunk, opacity: op }, style]} />;
}

export function SkeletonRow({ gap = 12 }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, marginTop: gap }}>
      <Skeleton w={50} h={50} r={8} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton w="72%" h={13} />
        <Skeleton w="40%" h={11} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ n = 6 }) {
  return <View>{Array.from({ length: n }).map((_, i) => <SkeletonRow key={i} />)}</View>;
}

export function SkeletonCards({ n = 4 }) {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ width: 132 }}>
          <Skeleton w={132} h={132} r={12} />
          <Skeleton w="86%" h={12} style={{ marginTop: 10 }} />
          <Skeleton w="52%" h={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonHero() {
  return (
    <View style={{ alignItems: "center", paddingTop: 16, paddingHorizontal: 20 }}>
      <Skeleton w={200} h={200} r={16} />
      <Skeleton w={96} h={11} style={{ marginTop: 20 }} />
      <Skeleton w={180} h={22} style={{ marginTop: 14 }} />
      <Skeleton w={120} h={12} style={{ marginTop: 10 }} />
    </View>
  );
}

export function SongRow({ song, list, subtitle, num }) {
  const { t, isLiked, toggleLike } = useStore();
  const { play } = usePlayer();
  const liked = isLiked(song.id);
  return (
    <View style={st.row}>
      {num ? <Text style={{ color: t.faint, fontSize: 13, fontWeight: "700", width: 22, textAlign: "center" }}>{num}</Text> : null}
      <Pressable onPress={() => play(song, list ?? [song])} style={st.rowMain} hitSlop={4}>
        <Cover uri={coverOf(song) ?? song.cover} size={50} radius={8} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text numberOfLines={1} style={{ color: t.ink, fontSize: 15, fontWeight: "600" }}>{song.name}</Text>
          <Text numberOfLines={1} style={{ color: t.muted, fontSize: 12, marginTop: 3 }}>
            {subtitle ?? artistsOf(song).join(", ")}
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={() => toggleLike(song)} hitSlop={10} style={st.rowSide}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? t.accent : t.muted} />
      </Pressable>
    </View>
  );
}

export function Shelf({ title, onSeeAll, children }) {
  const { t } = useStore();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ color: t.ink, fontSize: 20, fontWeight: "800" }}>{title}</Text>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={10}>
            <Text style={{ color: t.muted, fontSize: 12.5, fontWeight: "700" }}>More</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function IconBtn({ name, onPress, size = 22, color, style }) {
  const { t } = useStore();
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[st.iconBtn, style]}>
      <Ionicons name={name} size={size} color={color ?? t.ink} />
    </Pressable>
  );
}

export function Fab({ icon = "play", onPress, size = 62 }) {
  const { t } = useStore();
  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.42)} color={t.onAccent} />
    </Pressable>
  );
}

export function Chip({ children, active, onPress }) {
  const { t } = useStore();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: active ? t.accent : t.glass,
      }}
    >
      <Text style={{ color: active ? t.onAccent : t.ink, fontSize: 13, fontWeight: "600" }}>{children}</Text>
    </Pressable>
  );
}

export function ThemeSheet({ visible, onClose }) {
  const { t, mode, accent, setAccent, toggleTheme } = useStore();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: t.panel, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 48 }}>
          <Text style={{ color: t.ink, fontSize: 21, fontWeight: "800" }}>Appearance</Text>

          <Text style={{ color: t.muted, fontSize: 12, fontWeight: "700", marginTop: 18, marginBottom: 10 }}>THEME</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {["dark", "light"].map((m) => (
              <Pressable
                key={m}
                onPress={() => mode !== m && toggleTheme()}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: mode === m ? t.sunk : t.glass,
                }}
              >
                <Text style={{ color: mode === m ? t.ink : t.muted, fontSize: 14, fontWeight: "700", textTransform: "capitalize" }}>{m}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: t.muted, fontSize: 12, fontWeight: "700", marginTop: 22, marginBottom: 12 }}>ACCENT</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {ACCENTS.map((a) => (
              <Pressable key={a.id} onPress={() => setAccent(a.id)} style={{ alignItems: "center", width: 56 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: a.hex,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: accent === a.id ? 3 : 0,
                    borderColor: t.ink,
                  }}
                >
                  {accent === a.id ? <Ionicons name="checkmark" size={22} color="#fff" /> : null}
                </View>
                <Text numberOfLines={1} style={{ color: accent === a.id ? t.ink : t.muted, fontSize: 11.5, fontWeight: "600", marginTop: 6 }}>{a.name}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={{ marginTop: 26, alignSelf: "stretch", paddingVertical: 14, borderRadius: 16, backgroundColor: t.accent, alignItems: "center" }}
          >
            <Text style={{ color: t.onAccent, fontSize: 15, fontWeight: "800" }}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 6 },
  rowMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  rowSide: { paddingLeft: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
