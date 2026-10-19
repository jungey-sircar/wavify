package main

import (
	"encoding/json"
	"strings"
)

// Models mirror the saavn.dev-style JSON shapes returned by the
// listenfree.in backends (verified against live endpoints + HAR).

type QualityURL struct {
	Quality string `json:"quality"`
	URL     string `json:"url"`
}

type Artist struct {
	ID     string       `json:"id,omitempty"`
	Name   string       `json:"name"`
	Role   string       `json:"role,omitempty"`
	Image  []QualityURL `json:"image,omitempty"`
	URL    string       `json:"url,omitempty"`
	DominantColor string `json:"dominantColor,omitempty"`
	Bio    []QualityURL `json:"bio,omitempty"`
}

type AlbumRef struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	URL  string `json:"url,omitempty"`
}

// ArtistSet handles both shapes used by the APIs:
// array of artists (search) or {primary, featured, all} object (detail).
type ArtistSet struct {
	Primary  []Artist `json:"primary,omitempty"`
	Featured []Artist `json:"featured,omitempty"`
	All      []Artist `json:"all,omitempty"`
}

func (a *ArtistSet) UnmarshalJSON(data []byte) error {
	trimmed := strings.TrimLeft(string(data), " ")
	if len(trimmed) == 0 || trimmed[0] == '[' || trimmed == "null" {
		var flat []Artist
		if err := json.Unmarshal(data, &flat); err != nil {
			return err
		}
		a.All = flat
		return nil
	}
	type alias ArtistSet
	return json.Unmarshal(data, (*alias)(a))
}

type Song struct {
	ID              string       `json:"id"`
	Name            string       `json:"name"`
	Title           string       `json:"title,omitempty"`
	Type            string       `json:"type,omitempty"`
	Year            string       `json:"year,omitempty"`
	ReleaseDate     string       `json:"releaseDate,omitempty"`
	Duration        int          `json:"duration"`
	Label           string       `json:"label,omitempty"`
	Language        string       `json:"language,omitempty"`
	Explicit        bool         `json:"explicitContent,omitempty"`
	PlayCount       int64        `json:"playCount,omitempty"`
	HasLyrics       bool         `json:"hasLyrics,omitempty"`
	LyricsID        *string      `json:"lyricsId"`
	URL             string       `json:"url,omitempty"`
	Copyright       string       `json:"copyright,omitempty"`
	Album           AlbumRef     `json:"album"`
	PrimaryArtists  []Artist     `json:"primaryArtists"`
	FeaturedArtists []Artist     `json:"featuredArtists"`
	AllArtists      ArtistSet    `json:"artists,omitempty"`
	Image           []QualityURL `json:"image"`
	DownloadURL     []QualityURL `json:"downloadUrl"`
}

// FlexString accepts both "2026" and 2026.
type FlexString string

func (f *FlexString) UnmarshalJSON(data []byte) error {
	d := strings.Trim(string(data), " ")
	if len(d) > 0 && d[0] == '"' {
		return json.Unmarshal(data, (*string)(f))
	}
	var n json.Number
	if err := json.Unmarshal(data, &n); err != nil {
		return err
	}
	*f = FlexString(n)
	return nil
}

type Album struct {
	ID             string       `json:"id"`
	Name           string       `json:"name"`
	Year           FlexString   `json:"year,omitempty"`
	Type           string       `json:"type,omitempty"`
	ReleaseDate    string       `json:"releaseDate,omitempty"`
	Duration       int          `json:"duration,omitempty"`
	Label          string       `json:"label,omitempty"`
	Language       string       `json:"language,omitempty"`
	Explicit       bool         `json:"explicitContent,omitempty"`
	PlayCount      int64        `json:"playCount,omitempty"`
	SongCount      int          `json:"songCount,omitempty"`
	URL            string       `json:"url,omitempty"`
	Copyright      string       `json:"copyright,omitempty"`
	PrimaryArtists string       `json:"primaryArtists,omitempty"`
	Artists        ArtistSet    `json:"artists,omitempty"`
	Image          []QualityURL `json:"image"`
	Songs          []Song       `json:"songs,omitempty"`
}

type Playlist struct {
	ID             string       `json:"id"`
	Name           string       `json:"name"`
	UserID         string       `json:"userId,omitempty"`
	User           string       `json:"userName,omitempty"`
	Type           string       `json:"type,omitempty"`
	SongCount      int          `json:"songCount,omitempty"`
	Description    string       `json:"description,omitempty"`
	Language       string       `json:"language,omitempty"`
	URL            string       `json:"url,omitempty"`
	FollowerCount  int64        `json:"followerCount,omitempty"`
	Image          []QualityURL `json:"image"`
	Songs          []Song       `json:"songs,omitempty"`
}

type ArtistDetail struct {
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	Role          string       `json:"role,omitempty"`
	Image         []QualityURL `json:"image"`
	DominantColor string       `json:"dominantColor,omitempty"`
	Type          string       `json:"type,omitempty"`
	URL           string       `json:"url,omitempty"`
	IsVerified    bool         `json:"isVerified,omitempty"`
	Albums        []Album      `json:"albums,omitempty"`
	Songs         []Song       `json:"topSongs,omitempty"`
	FollowerCount int64        `json:"followerCount,omitempty"`
}

// ---- search ----

type searchResp struct {
	Success bool `json:"success"`
	Data    struct {
		Total  int     `json:"total"`
		Start  int     `json:"start"`
		Results []Song `json:"results"`
	} `json:"data"`
}

type albumSearchResp struct {
	Success bool `json:"success"`
	Data    struct {
		Total   int     `json:"total"`
		Start   int     `json:"start"`
		Results []Album `json:"results"`
	} `json:"data"`
}

type playlistSearchResp struct {
	Success bool `json:"success"`
	Data    struct {
		Total   int        `json:"total"`
		Start   int        `json:"start"`
		Results []Playlist `json:"results"`
	} `json:"data"`
}

type artistSearchResp struct {
	Success bool `json:"success"`
	Data    struct {
		Total   int            `json:"total"`
		Start   int            `json:"start"`
		Results []ArtistDetail `json:"results"`
	} `json:"data"`
}

// ---- details ----

type songsResp struct {
	Success bool   `json:"success"`
	Data    []Song `json:"data"`
}

type albumResp struct {
	Success bool  `json:"success"`
	Data    Album `json:"data"`
}

type playlistResp struct {
	Success bool     `json:"success"`
	Data    Playlist `json:"data"`
}

type artistResp struct {
	Success bool         `json:"success"`
	Data    ArtistDetail `json:"data"`
}

// ---- lyrics ----

type Lyric struct {
	Synced       string `json:"syncedLyrics,omitempty"`
	Plain        string `json:"plainLyrics,omitempty"`
	TrackName    string `json:"trackName,omitempty"`
	ArtistName   string `json:"artistName,omitempty"`
	AlbumName    string `json:"albumName,omitempty"`
	Instrumental bool   `json:"instrumental,omitempty"`
	Duration     float64 `json:"duration,omitempty"`
}
