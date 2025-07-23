package router

import (
	"net/http"

	"github.com/BGMloop/audiotales-api/internal/handlers"
	"github.com/BGMloop/audiotales-api/internal/middleware"
	"github.com/go-chi/chi/v5"
)

func NewRouter() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestLogger)

	r.Get("/health", handlers.HealthHandler)

	r.Route("/api", func(r chi.Router) {
		// r.Use(middleware.AuthMiddleware) // Apply auth middleware to all API routes
		r.Get("/ping", handlers.PingHandler)
		r.Post("/story", handlers.StoryHandler)
		r.Get("/me", handlers.MeHandler)
	})

	r.Route("/stripe", func(r chi.Router) {
		r.Post("/create-checkout-session", handlers.CreateCheckoutSessionHandler)
		r.Post("/webhook", handlers.StripeWebhookHandler)
	})

	return r
}
