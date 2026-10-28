import React from "react";
import { Platform, Text } from "react-native";
import { Ionicons as NativeIonicons } from "@expo/vector-icons";

const GLYPHS = {
  "albums": "▦",
  "albums-outline": "▤",
  "chevron-back": "‹",
  "chevron-down": "⌄",
  "checkmark": "✓",
  "checkmark-circle": "✓",
  "close": "×",
  "close-circle": "⊗",
  "cloud-download-outline": "↓",
  "document-text": "▤",
  "document-text-outline": "▧",
  "download-outline": "↓",
  "heart": "♥",
  "heart-outline": "♡",
  "home": "⌂",
  "home-outline": "⌂",
  "log-out-outline": "↪",
  "musical-notes": "♫",
  "pause": "Ⅱ",
  "play": "▶",
  "play-skip-back": "◀◀",
  "play-skip-forward": "▶▶",
  "search": "⌕",
  "settings-outline": "⚙",
  "time": "◷",
  "time-outline": "◷",
  "trash-outline": "⌫",
  "trail-sign": "♢",
};

export function Ionicons({ name, size = 24, color, style, ...props }) {
  if (Platform.OS !== "web") {
    return <NativeIonicons name={name} size={size} color={color} style={style} {...props} />;
  }

  return (
    <Text
      accessibilityLabel={props.accessibilityLabel ?? name}
      style={[
        {
          color,
          fontSize: size,
          lineHeight: size * 1.15,
          fontFamily: "Segoe UI Symbol, Segoe UI, sans-serif",
          fontWeight: name === "heart" || name === "play" ? "700" : "400",
          textAlign: "center",
        },
        style,
      ]}
      {...props}
    >
      {GLYPHS[name] ?? "•"}
    </Text>
  );
}
