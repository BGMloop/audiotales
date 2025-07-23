package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

type User struct {
	FreeCount    int
	LastReset    time.Time
	IsSubscribed bool
}

var userStore = map[string]*User{
	"demo@user.com": {
		FreeCount:    3,
		LastReset:    time.Now(), // initialized now
		IsSubscribed: false,
	},
}

func StoryHandler(w http.ResponseWriter, r *http.Request) {
	email := r.Header.Get("X-User-Email") // simulate auth
	user := userStore[email]

	if !user.IsSubscribed && user.FreeCount <= 0 {
		http.Error(w, "Free quota exceeded", http.StatusPaymentRequired)
		return
	}

	if !user.IsSubscribed {
		user.FreeCount--
		userStore[email] = user
	}

	json.NewEncoder(w).Encode(map[string]string{"story": "Once upon a time..."})
}

func MeHandler(w http.ResponseWriter, r *http.Request) {
	email := r.Header.Get("X-User-Email")
	user := userStore[email]
	maybeResetQuota(user)

	json.NewEncoder(w).Encode(map[string]any{
		"FreeCount":    user.FreeCount,
		"IsSubscribed": user.IsSubscribed,
	})
}

func maybeResetQuota(u *User) {
	if time.Since(u.LastReset) >= 30*24*time.Hour {
		u.FreeCount = 0
		u.LastReset = time.Now()
	}
}
