import Constants from "expo-constants";

// Backend base URL. Resolution order:
//   1. EXPO_PUBLIC_API_BASE env var, set per environment via .env (see .env.example)
//   2. hostUri derivation in dev (Metro debugger host), handy for LAN dev
//   3. localhost:8000 fallback for local backend runs
let base = process.env.EXPO_PUBLIC_API_BASE;

if (!base && __DEV__ && Constants.expoConfig?.hostUri) {
  base = `http://${Constants.expoConfig.hostUri.split(":")[0]}:8000`;
}

export const BASE = base || "http://localhost:8000";
