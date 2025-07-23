package middleware

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/MicahParks/keyfunc"
	"github.com/golang-jwt/jwt/v4"
)

var (
	clerkIssuer = os.Getenv("CLERK_ISSUER")
	jwksURL     = clerkIssuer + "/.well-known/jwks.json"
	userKey     = "user"
	jwks        *keyfunc.JWKS
)

func init() {
	if clerkIssuer == "" {
		log.Fatal("❌ CLERK_ISSUER is not set in environment!")
	}
	log.Printf("🔑 Using Clerk Issuer: %s", clerkIssuer)
	log.Printf("🔗 JWKS URL: %s", jwksURL)

	var err error
	jwks, err = keyfunc.Get(jwksURL, keyfunc.Options{})
	if err != nil {
		log.Fatalf("❌ Failed to get JWKS from Clerk: %v", err)
	}
	log.Println("✅ Clerk JWKS loaded successfully")
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractBearerToken(r.Header.Get("Authorization"))
		if tokenStr == "" {
			log.Println("🚫 Missing or malformed Authorization header")
			http.Error(w, "Unauthorized - Missing token", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			return jwks.Keyfunc(&jwt.Token{
				Header: token.Header,
				Claims: token.Claims,
				Method: token.Method,
			})
		})
		if err != nil || !token.Valid {
			log.Printf("🚫 Invalid token: %v\n", err)
			http.Error(w, "Unauthorized - Invalid token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			log.Println("🚫 Could not parse JWT claims")
			http.Error(w, "Unauthorized - Invalid claims", http.StatusUnauthorized)
			return
		}

		email, _ := claims["email"].(string)
		userID, _ := claims["sub"].(string)
		log.Printf("✅ Authenticated user: %s (%s)", email, userID)

		ctx := context.WithValue(r.Context(), userKey, map[string]string{
			"email":  email,
			"userID": userID,
		})

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractBearerToken(header string) string {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return parts[1]
}

func GetUserFromContext(ctx context.Context) (string, string, error) {
	val := ctx.Value(userKey)
	if val == nil {
		return "", "", errors.New("no user in context")
	}
	info := val.(map[string]string)
	return info["userID"], info["email"], nil
}
