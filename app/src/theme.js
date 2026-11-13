export const ACCENTS = [
  { id: "spotify", name: "Spotify Green", hex: "#1DB954" },
  { id: "green", name: "Neon Green", hex: "#1ED760" },
  { id: "blue", name: "Blue", hex: "#3D91F4" },
  { id: "purple", name: "Purple", hex: "#9B5CF2" },
  { id: "pink", name: "Pink", hex: "#F05CA9" },
  { id: "orange", name: "Orange", hex: "#F2883D" },
  { id: "red", name: "Red", hex: "#E91413" },
];

const hexOf = (id) => (ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]).hex;

export const DARK = {
  mode: "dark",
  bg: "#121212",
  panel: "#181818",
  sunk: "#242424",
  hover: "#2A2A2A",
  ink: "#FFFFFF",
  muted: "#B3B3B3",
  faint: "#6A6A6A",
  hair: "rgba(255,255,255,0.08)",
  glass: "rgba(18,18,18,0.96)",
  onAccent: "#000000",
  dimInk: "rgba(255,255,255,0.38)",
};

export const LIGHT = {
  mode: "light",
  bg: "#FAFAFA",
  panel: "#FFFFFF",
  sunk: "#EFEFEF",
  hover: "#E5E5E5",
  ink: "#111111",
  muted: "#5B5B5B",
  faint: "#9A9A9A",
  hair: "rgba(0,0,0,0.08)",
  glass: "rgba(255,255,255,0.90)",
  onAccent: "#FFFFFF",
  dimInk: "rgba(0,0,0,0.28)",
};

// Opaque light blue theme for the player when a song is chosen
export const PLAYER_THEME = {
  bg: "#38BDF8", // Distinct opaque light blue (Sky-400)
  ink: "#0F172A", // Deep navy-black for ultra high contrast & readability
  muted: "#1E3A8A", // Deep royal navy for secondary text (artists, times)
  faint: "rgba(15, 23, 42, 0.45)", // Subtle labels
  track: "rgba(15, 23, 42, 0.22)", // Progress slider track background
  thumb: "#0F172A", // Scrubber thumb
  btnBg: "#0F172A", // Primary circular play/pause button
  btnInk: "#FFFFFF", // Icon inside primary button
  hair: "rgba(15, 23, 42, 0.14)", // Divider & border
  cardBg: "rgba(255, 255, 255, 0.25)", // Pill / card background inside player
};

export function makeTheme(mode, accentId) {
  const base = mode === "light" ? LIGHT : DARK;
  const hex = hexOf(accentId);
  return {
    ...base,
    accent: hex,
    onAccent: accentId === "spotify" || accentId === "green" ? "#000000" : "#FFFFFF",
  };
}

export const CARD = { borderRadius: 8, overflow: "hidden" };
export const label = { fontWeight: "700", letterSpacing: 0.4 };

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.5,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
export const shadow = () => SHADOW;

