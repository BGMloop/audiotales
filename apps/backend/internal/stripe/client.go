package stripeclient

import (
	// "log"
	"os"

	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

func Init() {
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

func CreateCheckoutSession(customerEmail string) (*stripe.CheckoutSession, error) {
	params := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(os.Getenv("FRONTEND_URL") + "/success"),
		CancelURL:  stripe.String(os.Getenv("FRONTEND_URL") + "/cancel"),
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String("price_1RJJmiCjt0bu8bnDyCJxJORo"), // Replace with real price ID from Stripe
				Quantity: stripe.Int64(1),
			},
		},
		CustomerEmail: stripe.String(customerEmail),
	}
	return session.New(params)
}
