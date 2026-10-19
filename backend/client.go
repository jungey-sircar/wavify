package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// Backends discovered from the listenfree.in JS bundle, in failover order.
var backends = []string{
	"https://music-api2.albatross0071.workers.dev/api",
	"https://backend2.listenfree.in/api",
	"https://backend.listenfree.in/api",
	"https://music-api.albatross0071.workers.dev/api",
}

const lrclibBase = "https://lrclib.net"

var client = &http.Client{
	Timeout:   15 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{Timeout: 5 * time.Second}).DialContext,
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 100,
		IdleConnTimeout:     90 * time.Second,
		ForceAttemptHTTP2:   true,
	},
}

func getJSON(ctx context.Context, path string, out any) error {
	// Relative path (like /songs/{id}) => failover across all backends.
	if strings.HasPrefix(path, "/") {
		offset := 0
		var lastErr error
		for i := range len(backends) {
			u := strings.TrimRight(backends[(i+offset)%len(backends)], "/") + path
			err := getJSONDirect(ctx, u, out)
			if err == nil {
				return nil
			}
			lastErr = err
		}
		return lastErr
	}
	return getJSONDirect(ctx, path, out)
}

func getJSONDirect(ctx context.Context, endpoint string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusTooManyRequests {
		return errors.New("rate limited")
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status %d for %s", resp.StatusCode, endpoint)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
	if err != nil {
		return err
	}
	return json.Unmarshal(body, out)
}

// ---- public API surface ----

func SearchSongs(ctx context.Context, q string) ([]Song, error) {
	var r searchResp
	if err := getJSON(ctx, "/search/songs?limit=40&query="+url.QueryEscape(q), &r); err != nil {
		return nil, err
	}
	for i := range r.Data.Results {
		cleanerSong(&r.Data.Results[i])
	}
	return r.Data.Results, nil
}

func SearchAlbums(ctx context.Context, q string) ([]Album, error) {
	var r albumSearchResp
	if err := getJSON(ctx, "/search/albums?limit=40&query="+url.QueryEscape(q), &r); err != nil {
		return nil, err
	}
	for i := range r.Data.Results {
		cleanerAlbum(&r.Data.Results[i])
	}
	return r.Data.Results, nil
}

func SearchArtists(ctx context.Context, q string) ([]ArtistDetail, error) {
	var r artistSearchResp
	if err := getJSON(ctx, "/search/artists?limit=40&query="+url.QueryEscape(q), &r); err != nil {
		return nil, err
	}
	for i := range r.Data.Results {
		cleanerArtistDetail(&r.Data.Results[i])
	}
	return r.Data.Results, nil
}

func SearchPlaylists(ctx context.Context, q string) ([]Playlist, error) {
	var r playlistSearchResp
	if err := getJSON(ctx, "/search/playlists?limit=40&query="+url.QueryEscape(q), &r); err != nil {
		return nil, err
	}
	for i := range r.Data.Results {
		cleanerPlaylist(&r.Data.Results[i])
	}
	return r.Data.Results, nil
}

func GetSong(ctx context.Context, id string) (*Song, error) {
	var r songsResp
	if err := getJSON(ctx, "/songs/"+id, &r); err != nil {
		return nil, err
	}
	if len(r.Data) == 0 {
		return nil, errors.New("song not found")
	}
	cleanerSong(&r.Data[0])
	return &r.Data[0], nil
}

func GetAlbum(ctx context.Context, id string) (*Album, error) {
	var r albumResp
	if err := getJSON(ctx, "/albums?id="+id, &r); err != nil {
		return nil, err
	}
	cleanerAlbum(&r.Data)
	return &r.Data, nil
}

func GetPlaylist(ctx context.Context, id string) (*Playlist, error) {
	var r playlistResp
	if err := getJSON(ctx, "/playlists?id="+id, &r); err != nil {
		return nil, err
	}
	cleanerPlaylist(&r.Data)
	return &r.Data, nil
}

func GetArtist(ctx context.Context, id string) (*ArtistDetail, error) {
	var r artistResp
	if err := getJSON(ctx, "/artists/"+id+"?page=1", &r); err != nil {
		return nil, err
	}
	cleanerArtistDetail(&r.Data)
	return &r.Data, nil
}

func GetLyricsFromAPI(ctx context.Context, id string) (*Lyric, error) {
	// listenfree lyrics worker (T5 in bundle): /api/songs/{id}/lyrics
	var r Lyric
	if err := getJSONDirect(ctx, "https://listenfreelyrics.abdulazeezmd060.workers.dev/api/songs/"+id+"/lyrics", &r); err != nil {
		return nil, err
	}
	return &r, nil
}

func GetLyricsFromLRCLIB(ctx context.Context, song Song) (*Lyric, error) {
	artist := primaryArtistsJoined(song)
	firstArtist := ""
	for _, a := range song.PrimaryArtists {
		firstArtist = a.Name
		break
	}
	if firstArtist == "" {
		for _, a := range song.AllArtists.All {
			if a.Role == "primary_artists" {
				firstArtist = a.Name
				break
			}
		}
	}
	variants := []url.Values{}
	build := func(extra url.Values) url.Values {
		v := url.Values{}
		v.Set("track_name", song.Name)
		for k := range extra {
			v.Set(k, extra.Get(k))
		}
		return v
	}
	if firstArtist != "" && song.Album.Name != "" {
		v := build(url.Values{"artist_name": {firstArtist}, "album_name": {song.Album.Name}})
		if song.Duration > 0 {
			v.Set("duration", fmt.Sprint(song.Duration))
		}
		variants = append(variants, v)
	}
	if firstArtist != "" {
		variants = append(variants, build(url.Values{"artist_name": {firstArtist}}))
	}
	if artist != "" && artist != firstArtist {
		variants = append(variants, build(url.Values{"artist_name": {artist}}))
	}
	variants = append(variants, build(url.Values{}))
	// last-resort freetext query (search API supports q=)
	if song.Name != "" {
		qv := url.Values{}
		qv.Set("q", strings.TrimSpace(song.Name+" "+firstArtist))
		variants = append(variants, qv)
	}
	pick := func(cands []Lyric) (*Lyric, bool) {
		if song.Duration > 0 {
			for i := range cands {
				if cands[i].Synced != "" && cands[i].Duration > 0 && absDiff(cands[i].Duration, float64(song.Duration)) <= 6 {
					cand := cands[i]
					return &cand, true
				}
			}
		}
		for i := range cands {
			if cands[i].Synced != "" {
				cand := cands[i]
				return &cand, true
			}
		}
		for i := range cands {
			if cands[i].Plain != "" {
				cand := cands[i]
				return &cand, true
			}
		}
		return nil, false
	}
	get := func(q url.Values) (*Lyric, bool) {
		var exact Lyric
		err := getJSONDirect(ctx, lrclibBase+"/api/get?"+q.Encode(), &exact)
		return &exact, err == nil && (exact.Synced != "" || exact.Plain != "")
	}
	search := func(q url.Values) (*Lyric, bool) {
		var candidates []Lyric
		if err := getJSONDirect(ctx, lrclibBase+"/api/search?"+q.Encode(), &candidates); err != nil {
			return nil, false
		}
		return pick(candidates)
	}
	attempts := 0
	for _, q := range variants {
		if attempts > 0 {
			time.Sleep(700 * time.Millisecond)
		}
		attempts++
		if hit, ok := get(q); ok {
			return hit, nil
		}
	}
	for _, q := range variants {
		if attempts > 0 {
			time.Sleep(700 * time.Millisecond)
		}
		attempts++
		var candidates []Lyric
		err := getJSONDirect(ctx, lrclibBase+"/api/search?"+q.Encode(), &candidates)
		if os.Getenv("LF_DEBUG") != "" {
			if err != nil {
				fmt.Fprintln(os.Stderr, "[lyrics] search err:", err.Error(), "q:", q.Encode())
			} else {
				fmt.Fprintln(os.Stderr, "[lyrics] search q:", q.Encode(), "candidates:", len(candidates))
			}
		}
		if err != nil {
			continue
		}
		if hit, ok := pick(candidates); ok {
			return hit, nil
		}
	}
	// one gentle retry pass; LRCLib throws 503 ServerOverload under bursts
	for _, q := range variants {
		time.Sleep(1200 * time.Millisecond)
		if hit, ok := search(q); ok && hit != nil {
			return hit, nil
		}
	}
	return nil, errors.New("no lyrics found")
}

// ---- text cleanup (upstream HTML-escapes names) ----

func cleanStr(s string) string {
	if !strings.Contains(s, "&") {
		return s
	}
	return html.UnescapeString(s)
}

func cleanArtist(a *Artist) { a.Name = cleanStr(a.Name) }

func cleanerArtistSet(set *ArtistSet) {
	for i := range set.Primary {
		cleanArtist(&set.Primary[i])
	}
	for i := range set.Featured {
		cleanArtist(&set.Featured[i])
	}
	for i := range set.All {
		cleanArtist(&set.All[i])
	}
}

func cleanerSong(s *Song) {
	s.Name = cleanStr(s.Name)
	s.Title = cleanStr(s.Title)
	s.Label = cleanStr(s.Label)
	s.Copyright = cleanStr(s.Copyright)
	s.Album.Name = cleanStr(s.Album.Name)
	cleanerArtistSet(&s.AllArtists)
	for i := range s.PrimaryArtists {
		cleanArtist(&s.PrimaryArtists[i])
	}
	for i := range s.FeaturedArtists {
		cleanArtist(&s.FeaturedArtists[i])
	}
}

func cleanerAlbum(a *Album) {
	a.Name = cleanStr(a.Name)
	a.Label = cleanStr(a.Label)
	cleanerArtistSet(&a.Artists)
	for i := range a.Songs {
		cleanerSong(&a.Songs[i])
	}
}

func cleanerPlaylist(p *Playlist) {
	p.Name = cleanStr(p.Name)
	p.Description = cleanStr(p.Description)
	for i := range p.Songs {
		cleanerSong(&p.Songs[i])
	}
}

func cleanerArtistDetail(a *ArtistDetail) {
	a.Name = cleanStr(a.Name)
	for i := range a.Albums {
		cleanerAlbum(&a.Albums[i])
	}
	for i := range a.Songs {
		cleanerSong(&a.Songs[i])
	}
}

func absDiff(a, b float64) float64 {
	if a > b {
		return a - b
	}
	return b - a
}

func primaryArtistsJoined(s Song) string {
	names := make([]string, 0, len(s.PrimaryArtists))
	for _, a := range s.PrimaryArtists {
		names = append(names, a.Name)
	}
	return strings.Join(names, ", ")
}
