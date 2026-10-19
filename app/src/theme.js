export const ACCENTS = [
  { id: "red", name: "Red", hex: "#E91413" },
  { id: "blue", name: "Blue", hex: "#3D91F4" },
  { id: "purple", name: "Purple", hex: "#9B5CF2" },
  { id: "pink", name: "Pink", hex: "#F05CA9" },
  { id: "orange", name: "Orange", hex: "#F2883D" },
  { id: "green", name: "Green", hex: "#1FC46E" },
];

const hexOf = (id) => (ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]).hex;

export const DARK = {
  mode: "dark",
  bg: "#121212",
  panel: "#1F1F1F",
  sunk: "#2A2A2A",
  ink: "#FFFFFF",
  muted: "#B3B3B3",
  faint: "#7A7A7A",
  hair: "rgba(255,255,255,0.07)",
  glass: "rgba(255,255,255,0.06)",
  onAccent: "#FFFFFF",
  dimInk: "rgba(255,255,255,0.38)",
};

export const LIGHT = {
  mode: "light",
  bg: "#FAFAFA",
  panel: "#FFFFFF",
  sunk: "#EFEFEF",
  ink: "#111111",
  muted: "#5B5B5B",
  faint: "#9A9A9A",
  hair: "rgba(0,0,0,0.08)",
  glass: "rgba(255,255,255,0.65)",
  onAccent: "#FFFFFF",
  dimInk: "rgba(0,0,0,0.28)",
};

export function makeTheme(mode, accentId) {
  return { ...(mode === "light" ? LIGHT : DARK), accent: hexOf(accentId) };
}

export const CARD = { borderRadius: 16, overflow: "hidden" };
export const label = { fontWeight: "700", letterSpacing: 0.4 };

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.4,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
  elevation: 12,
};
export const shadow = () => SHADOW;
