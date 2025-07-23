package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/BGMloop/audiotales-api/internal/config"
	"github.com/BGMloop/audiotales-api/internal/router"
)

func init() {
	// Log key environment variables for debugging
	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey == "" {
		log.Println("❌ STRIPE_SECRET_KEY is not set!")
	} else {
		log.Println("🔐 STRIPE_SECRET_KEY loaded (hidden for security)")
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		log.Println("❌ FRONTEND_URL is not set!")
	} else {
		log.Printf("🌐 FRONTEND_URL: %s\n", frontendURL)
	}
}

func main() {
	srv := &http.Server{
		Addr:    ":8080",
		Handler: router.NewRouter(),
	}

	// Start server in a goroutine
	go func() {
		log.Println("🚀 Server running on http://localhost:8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Listen error: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	<-stop // Wait here until interrupted

	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("❌ Graceful shutdown failed: %s\n", err)
	}

	log.Println("✅ Server shutdown complete.")
}
