package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// PORT comes from the host platform environment; ":port" binds all interfaces incl. IPv6 ::
var addr = ":" + func() string {
	if p := os.Getenv("PORT"); p != "" {
		return p
	}
	return "8000"
}()

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", index)
	mux.HandleFunc("/search", handleSearch)
	mux.HandleFunc("/song", handleSong)
	mux.HandleFunc("/album", handleAlbum)
	mux.HandleFunc("/playlist", handlePlaylist)
	mux.HandleFunc("/artist", handleArtist)
	mux.HandleFunc("/lyrics", handleLyrics)

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	port := strings.TrimPrefix(addr, ":")
	uri := "http://localhost:" + port
	indexJSON, _ := json.Marshal(map[string]any{"service": "wavify scraper", "status": "up", "endpoints": []string{
		uri + "/search?q=kesariya", uri + "/song?id=KGfDrbWe", uri + "/album?id=81718905",
		uri + "/playlist?id=903166403", uri + "/artist?id=456323", uri + "/lyrics?id=KGfDrbWe",
	}})
	_ = indexJSON
	_ = os.Stdout
	if err := srv.ListenAndServe(); err != nil {
		fatal(err)
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(v)
}

func fail(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]any{"success": false, "error": msg})
}

func index(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		fail(w, http.StatusNotFound, "unknown endpoint")
		return
	}
	port := "8000"
	writeJSON(w, http.StatusOK, map[string]any{
		"service": "wavify scraper",
		"status":  "up",
		"endpoints": []string{
			"http://localhost:" + port + "/search?q=kesariya",
			"http://localhost:" + port + "/song?id=KGfDrbWe",
			"http://localhost:" + port + "/album?id=81718905",
			"http://localhost:" + port + "/playlist?id=903166403",
			"http://localhost:" + port + "/artist?id=456323",
			"http://localhost:" + port + "/lyrics?id=KGfDrbWe",
		},
	})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		fail(w, http.StatusBadRequest, "missing ?q=")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	var (
		wg                                              sync.WaitGroup
		mu                                              sync.Mutex
		songs                                           []Song
		albums                                          []Album
		artists                                         []ArtistDetail
		playlists                                       []Playlist
		songErr, albumErr, artistErr, playlistErr error
	)
	wg.Add(4)
	go func() { defer wg.Done(); songs, songErr = SearchSongs(ctx, q) }()
	go func() { defer wg.Done(); albums, albumErr = SearchAlbums(ctx, q) }()
	go func() { defer wg.Done(); artists, artistErr = SearchArtists(ctx, q) }()
	go func() { defer wg.Done(); playlists, playlistErr = SearchPlaylists(ctx, q) }()
	wg.Wait()
	mu.Lock()
	defer mu.Unlock()

	if songErr != nil && albumErr != nil && artistErr != nil && playlistErr != nil {
		fail(w, http.StatusBadGateway, "all searches failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": map[string]any{
		"songs": nonNil(songs), "albums": nonNil2(albums), "artists": nonNil3(artists), "playlists": nonNil4(playlists),
	}})
}

func nonNil(in []Song) []Song { if in == nil { return []Song{} }; return in }

func nonNil2(in []Album) []Album { if in == nil { return []Album{} }; return in }

func nonNil3(in []ArtistDetail) []ArtistDetail { if in == nil { return []ArtistDetail{} }; return in }

func nonNil4(in []Playlist) []Playlist { if in == nil { return []Playlist{} }; return in }

func handleSong(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		fail(w, http.StatusBadRequest, "missing ?id=")
		return
	}
	s, err := GetSong(r.Context(), id)
	if err != nil {
		fail(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": s})
}

func handleAlbum(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		fail(w, http.StatusBadRequest, "missing ?id=")
		return
	}
	a, err := GetAlbum(r.Context(), id)
	if err != nil {
		fail(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": a})
}

func handlePlaylist(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		fail(w, http.StatusBadRequest, "missing ?id=")
		return
	}
	p, err := GetPlaylist(r.Context(), id)
	if err != nil {
		fail(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": p})
}

func handleArtist(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		fail(w, http.StatusBadRequest, "missing ?id=")
		return
	}
	a, err := GetArtist(r.Context(), id)
	if err != nil {
		fail(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "data": a})
}

func handleLyrics(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		fail(w, http.StatusBadRequest, "missing ?id=")
		return
	}
	s, err := GetSong(r.Context(), id)
	if err != nil {
		fail(w, http.StatusBadGateway, err.Error())
		return
	}
	l, lerr := GetLyricsFromLRCLIB(r.Context(), *s)
	if os.Getenv("LF_DEBUG") != "" {
		dbg := "nil"
		if l != nil {
			dbg = fmt.Sprintf("synced=%d plain=%d", len(l.Synced), len(l.Plain))
		}
		fmt.Fprintln(os.Stderr, "[lyrics] lrclib:", dbg, "err:", lerr)
	}
	if lerr != nil || (l.Synced == "" && l.Plain == "") {
		l, lerr = GetLyricsFromAPI(r.Context(), s.ID)
		if os.Getenv("LF_DEBUG") != "" {
			dbg := "nil"
			if l != nil {
				dbg = fmt.Sprintf("synced=%d plain=%d", len(l.Synced), len(l.Plain))
			}
			fmt.Fprintln(os.Stderr, "[lyrics] worker:", dbg, "err:", lerr)
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "song": s, "lyrics": l})
}

func fatal(err error) {
	panic(err)
}
