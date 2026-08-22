# Production Architecture

## High-Level Topology

```text
[Telegram Client / Browser]
          |
          v
[Frontend (Vite build served via CDN/static host)]
          |
          v
[Backend API Service (Node.js)]
          |
          v
[PostgreSQL (private network, isolated access)]
```

## Separation of Concerns

- **Frontend**: Static Telegram Mini App UI bundle only.
- **Backend API**: Auth, referral validation, game state APIs, admin APIs.
- **PostgreSQL**: Persistent data storage accessed only by backend services.

## Recommended Deployment Topology

- Frontend on static hosting/CDN (`https://yourdomain.com`).
- Backend API on separate service/runtime (`https://api.yourdomain.com`).
- PostgreSQL in private subnet/VPC with no public ingress.
- TLS termination at ingress/load balancer.

## Service Communication Flow

1. Telegram opens Mini App URL.
2. Frontend loads static assets from CDN/host.
3. Frontend calls backend API over HTTPS.
4. Backend validates Telegram data and business rules.
5. Backend reads/writes PostgreSQL.
6. Backend returns JSON responses to frontend.

## Database Isolation

- Dedicated production database: `crown_tap_game_prod`.
- Separate DB credentials per environment.
- Principle of least privilege for application role.
- No direct database access from frontend.

## Environment Separation

- **Development**: Local app + local DB, test bot/app settings.
- **Staging**: Production-like infra with isolated DB and Telegram test values.
- **Production**: Live Telegram app, production domain, production DB only.

Never share credentials or databases across development, staging, and production.
