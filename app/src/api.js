import Constants from "expo-constants";

// Production backend on the alwaysdata VPS (User program, PORT=8100, IPv6 ::).
// Metro/LAN fallback only used if the VPS is unreachable in dev.
const VPS = "https://srvfsdfasdf.alwaysdata.net";

function detectBase() {
  return VPS;
}

export const BASE = detectBase();

async function j(path) {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

export const img = (list, i = 2) =>
  Array.isArray(list) ? list[Math.min(i, list.length - 1)]?.url ?? null : list?.[i === 2 ? "2" : String(i)]?.url ?? null;

export function artistField(a) {
  if (!a) return [];
  if (Array.isArray(a)) return a.map((x) => x?.name).filter(Boolean);
  return [...(a.primary ?? []), ...(a.featured ?? [])].map((x) => x?.name).filter(Boolean);
}

export const artistsOf = (songOrAlbum) =>
  artistField(
    songOrAlbum?.artists ??
      (songOrAlbum?.primaryArtists ? { primary: [].concat(songOrAlbum.primaryArtists) } : [])
  );

export const coverOf = (x) => img(x?.image, 2) ?? img(x?.image, 1);

export const streamURL = (song, i = 3) =>
  song?.downloadUrl?.[i]?.url ?? song?.downloadUrl?.[3]?.url ?? song?.downloadUrl?.[1]?.url ?? song?.downloadUrl?.[0]?.url ?? null;

export const songMini = (s) => ({
  id: s.id,
  name: s.name,
  album: s.album?.name ?? null,
  cover: coverOf(s),
  artists: artistsOf(s),
  duration: s.duration ?? 0,
});

export const api = {
  search: (q) => j(`/search?q=${encodeURIComponent(q)}`),
  song: (id) => j(`/song?id=${encodeURIComponent(id)}`),
  album: (id) => j(`/album?id=${encodeURIComponent(id)}`),
  playlist: (id) => j(`/playlist?id=${encodeURIComponent(id)}`),
  artist: (id) => j(`/artist?id=${encodeURIComponent(id)}`),
};
