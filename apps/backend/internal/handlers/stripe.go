package handlers

import (
	"encoding/json"
	"net/http"

	stripeclient "github.com/BGMloop/audiotales-api/internal/stripe"
)

type EmailRequest struct {
	Email string `json:"email"`
}

func CreateCheckoutSessionHandler(w http.ResponseWriter, r *http.Request) {
	var body EmailRequest
	_ = json.NewDecoder(r.Body).Decode(&body)
	stripeclient.Init()

	sess, err := stripeclient.CreateCheckoutSession(body.Email)
	if err != nil {
		http.Error(w, "Could not create session", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"url": sess.URL})
}

func StripeWebhookHandler(w http.ResponseWriter, r *http.Request) {
	// Placeholder: you'd verify signature here and parse events
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Webhook received"))
}
