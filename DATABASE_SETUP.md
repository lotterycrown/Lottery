# Production Database Setup

## Prerequisites

- PostgreSQL **12+**
- `pgcrypto` extension enabled
- 5GB+ initial storage
- Daily automated backup capability

## Create Database and Role

```sql
CREATE ROLE crown_app_user WITH LOGIN PASSWORD 'change_this_password';
CREATE DATABASE crown_tap_game_prod OWNER crown_app_user;
```

Connect and enable extension:

```bash
psql -U postgres -d crown_tap_game_prod
```

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Connection Pooling

- Use a pooler (PgBouncer or managed equivalent) in transaction pooling mode.
- Start with conservative limits (example: 20–50 pooled connections per app instance).
- Monitor pool saturation and tune based on traffic.

## Migration Procedure

Validate schema/client first:

```bash
npx prisma validate
npx prisma generate
```

Deploy migrations:

```bash
DATABASE_URL="postgresql://localhost:5432/crown_tap_game_prod" npx prisma migrate deploy
```

Before production rollout, test migrations against a fresh database in a local/staging environment.

## Backup Strategy

- Daily automated full backups
- 30-day retention
- Off-site copy enabled
- Monthly restore drill

## Restore Procedure

```bash
pg_restore -U postgres -d crown_tap_game_prod backup.sql
```

## Monitoring

- Connection pool exhaustion
- Slow query frequency/latency
- Replication lag (if replicas are used)
- Disk space growth and free space
