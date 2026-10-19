# Wavify

A music streaming app for Android with a self hosted Go backend. Search songs, artists, albums and playlists, stream music over HTTP, get time synced lyrics, keep a history, like songs, and save your favourites for offline playback.

The backend scrapes metadata (songs, artists, albums, playlists, cover art, stream URLs) and pulls time synced lyrics. The app is an Expo (React Native) project built for Android.

## Features

- Search for songs, albums, artists and playlists
- Full screen player with cover art, next and previous controls and a draggable progress bar
- Time synced lyrics that scroll with the song
- Song queue with automatic advance to the next track
- Recent history, liked songs and offline downloads
- Sleep timer
- Dark and light themes with six accent colors
- Offline library with resumable downloads
- Custom splash screen and launcher icons

## Tech Stack

**Backend**: Go (standard library only), LRCLIB for synced lyrics

**App**: Expo (React Native), expo-audio for playback, AsyncStorage for local data, react-native-svg for branding

## Project Structure

```
backend/   Go API server (scraper + lyrics)
app/       Expo mobile app (screens, store, player, theme)
```

Inside `app/src`:

```
api.js        API client, maps backend responses to app models
player.js     Playback provider built on expo-audio
store.js      Global store: theme, likes, downloads, history, search history
theme.js      Theme definitions, dark/light modes, accent colors
components.js Shared UI (Cover, SongRow, shelves, skeletons)
screens/      Home, Collection(Search), Detail, Artist, Library, NowPlaying, Settings
```

## Configuration

No URLs, ports or keys are hardcoded. Copy the example env files and adjust them.

**App** (`app/`, Expo SDK 57 inlines `EXPO_PUBLIC_*` variables at bundle time):

```
cp app/.env.example app/.env
```

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_BASE` | Backend base URL, e.g. `https://your-backend-host` or `http://10.0.2.2:8000` for the Android emulator |

The `.env` file is git ignored. In dev, if no env var is set, the app derives the backend from the Metro debugger host (useful on a LAN) and falls back to `http://localhost:8000`.

**Backend** (`backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | Listen port, defaults to 8000 |
| `LF_DEBUG` | Set to 1 for debug prints in the lyrics handler |

## Backend Setup

Requirements: Go 1.21 or newer.

```bash
cd backend
cp .env.example .env
go run main.go
```

The server listens on the `PORT` from the environment (8000 by default).

```bash
# Linux / macOS
export PORT=8100
go run main.go

# Windows
$env:PORT="8100"
go run main.go
```

For a static build:

```bash
go build -o wavify-server .
```

It binds to all interfaces, so it also works behind a reverse proxy. On a PaaS, deploy it as a user program with the start command pointing at the built binary; the platform injects `PORT` at runtime.

## API Reference

| Endpoint | Param | Returns |
|---|---|---|
| `/` | | status info |
| `/search` | `q` | songs, albums, artists, playlists |
| `/song` | `id` | full song detail with CDN stream urls |
| `/album` | `id` | album with songs |
| `/playlist` | `id` | playlist with songs |
| `/artist` | `id` | artist profile, top songs, albums |
| `/lyrics` | `id` | time synced LRC lyrics when available |

Stream urls in song responses point to the upstream CDN (segments return 200/206 audio).

Set `LF_DEBUG=1` to get debug prints in the lyrics handler.

## App Setup

Requirements: Node.js 18+, Expo CLI. A real Android device or an emulator for testing. For APK builds, Android Studio (for the SDK and JDK) is required.

```bash
cd app
npx expo install
npx expo start
```

Set the backend URL in `app/.env` (create it from `.env.example`).

### Android APK Build

```bash
cd app
npx expo prebuild -p android --clean --no-install
cd android
gradlew.bat assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

On Windows, set these before running gradle:

```
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME=C:\Users\<you>\AppData\Local\Android\Sdk
```

### Regenerating Icons and Splash

Branding is generated from a single SVG source:

```bash
cd app
node scripts/gen-icons.js
```

This produces `assets/icon.png` plus the adaptive icon foreground, background and monochrome layers.

## Notes

- This project scrapes a public website for data and does not host, cache or redistribute any audio or lyrics itself. All playback streams come from the upstream CDN, lyrics come from LRCLIB. Use it for personal, non commercial listening only.
- Streaming quality options are set in the app Settings (low, medium, high).
- If playback refuses to start, check that your device can reach the backend host on the configured port.

## License

MIT
