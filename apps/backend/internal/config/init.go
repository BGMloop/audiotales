package config

import (
	"log"

	"github.com/joho/godotenv"
)

func init() {
	err := godotenv.Load("../backend.env")
	if err != nil {
		log.Println("⚠️  Could not load .env:", err)
	} else {
		log.Println("✅ Loaded .env before anything else")
	}
}
