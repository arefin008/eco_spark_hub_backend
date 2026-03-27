# Purchase and Payment

- Create pending purchase for paid idea
- `POST /api/v1/purchases` now returns Stripe Checkout URL
- `POST /api/v1/payments/:purchaseId/checkout` regenerates Stripe Checkout URL for pending/failed purchases
- `GET /api/v1/payments/:purchaseId/status` returns current payment status for logged-in owner
- Stripe success redirects to `GET /api/v1/payments/stripe/success` and renders `payment.ejs`
- Stripe cancel redirects to `GET /api/v1/payments/stripe/cancel`
- Webhook endpoint: `POST /api/v1/payments/webhook`
- Track `transactionId`, `status`, and `purchasedAt`
- Paid idea details remain locked until purchase status is `PAID`
