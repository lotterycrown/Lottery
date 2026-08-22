# Backend Deployment Runbook

## Prerequisites

- PostgreSQL 14+ running and accessible
- Node.js 18+ installed
- Docker (optional, for containerized deployment)
- Telegram Bot Token from @BotFather

## Environment Setup

1. **Create production `.env` file**

```bash
cd backend
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database
DATABASE_URL="postgresql://user:password@prod-db.example.com:5432/crown_tap_game"

# Server
NODE_ENV="production"
PORT=3001
API_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com/app"

# JWT
JWT_SECRET="<generate-strong-random-key>"
JWT_EXPIRY="7d"

# Telegram
TELEGRAM_BOT_TOKEN="<your-bot-token-from-botfather>"
TELEGRAM_BOT_USERNAME="<your_bot_username>"
TELEGRAM_MINI_APP_URL="https://yourdomain.com/app"
TELEGRAM_WEBHOOK_SECRET="<generate-random-webhook-secret>"

# Logging
LOG_LEVEL="info"
```

## Database Setup

### Step 1: Create Database

```bash
psql -U postgres -h prod-db.example.com

CREATE DATABASE crown_tap_game;
CREATE USER crown_user WITH PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE crown_tap_game TO crown_user;
```

### Step 2: Run Migrations

```bash
cd backend
npm install --production
npm run prisma:generate
npm run prisma:migrate:prod
```

### Step 3: Seed Data

```bash
npm run prisma:seed
```

This creates:
- Default game configuration
- Initial tasks

## Application Deployment

### Option A: Direct Node.js (Recommended for smaller deployments)

1. **Build**
   ```bash
   npm run build
   ```

2. **Install production dependencies**
   ```bash
   npm install --production
   ```

3. **Start with process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name "crown-api" --instances 2 --merge-logs
   pm2 save
   pm2 startup
   ```

### Option B: Docker Deployment

1. **Create `Dockerfile`** (in backend/)
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --production
   
   COPY dist ./dist
   COPY prisma ./prisma
   
   ENV NODE_ENV=production
   
   EXPOSE 3001
   
   CMD ["node", "dist/server.js"]
   ```

2. **Build & Push**
   ```bash
   docker build -t crown-api:1.0.0 .
   docker tag crown-api:1.0.0 your-registry/crown-api:1.0.0
   docker push your-registry/crown-api:1.0.0
   ```

3. **Deploy**
   ```bash
   docker run -d \
     --name crown-api \
     -e DATABASE_URL="postgresql://..." \
     -e JWT_SECRET="..." \
     -e TELEGRAM_BOT_TOKEN="..." \
     -p 3001:3001 \
     your-registry/crown-api:1.0.0
   ```

### Option C: Cloud Platforms

#### Heroku
```bash
heroku create crown-tap-api
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set JWT_SECRET="..."
heroku config:set TELEGRAM_BOT_TOKEN="..."
heroku addons:create heroku-postgresql:standard-0 # If using Heroku Postgres
git push heroku main
```

#### Railway.app
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway add --dockerfile
railway up
```

#### AWS EC2 + RDS
1. Launch EC2 instance (t3.micro or larger)
2. Create RDS PostgreSQL instance
3. SSH into EC2 and follow "Direct Node.js" steps above
4. Configure security groups for database access
5. Set up HTTPS with Let's Encrypt

## Post-Deployment

### 1. Verify Health
```bash
curl https://api.yourdomain.com/health

# Expected response:
# {"success":true,"status":"healthy","timestamp":...,"version":"1.0.0"}
```

### 2. Configure Reverse Proxy (Nginx)

```nginx
upstream crown_api {
  server localhost:3001;
  server localhost:3002; # If using multiple instances
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://crown_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Connection "upgrade";
  }
}
```

### 3. Set Up SSL/TLS

```bash
certbot certonly --nginx -d api.yourdomain.com
```

### 4. Configure Telegram Bot

Set up webhook for Telegram Bot (if using webhooks for future bot commands):

```bash
curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.yourdomain.com/telegram/webhook",
    "secret_token": "<WEBHOOK_SECRET>"
  }'
```

### 5. Set Up Monitoring

**Option A: Built-in logging**
- Logs are written to stdout (captured by PM2/Docker)
- Configure log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

**Option B: External APM (e.g., New Relic, Datadog, Sentry)**

```bash
npm install newrelic
# Add to server.ts startup
```

### 6. Database Backups

**Automated PostgreSQL backups:**

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/var/backups/db"
DB_NAME="crown_tap_game"
DB_USER="crown_user"
DB_HOST="prod-db.example.com"

DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/crown_tap_game_$DATE.sql.gz"

pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $FILE

# Keep last 30 days
find $BACKUP_DIR -name "crown_tap_game_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILE"
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup.sh
```

## Rollback Procedure

### Rollback Application

```bash
# PM2
pm2 save
pm2 list
pm2 delete crown-api
# Deploy previous version
pm2 start dist/server.js --name "crown-api"

# Docker
docker stop crown-api
docker rm crown-api
docker run -d --name crown-api \
  -e DATABASE_URL="..." \
  your-registry/crown-api:1.0.0  # Previous version tag
```

### Rollback Database

```bash
# List available backups
ls /var/backups/db/

# Restore from backup
gunzip < /var/backups/db/crown_tap_game_20260822_120000.sql.gz | \
  psql -h prod-db.example.com -U crown_user crown_tap_game
```

## Monitoring & Alerts

### Health Check

Set up monitoring to check `/health` endpoint every 60 seconds.

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, calls, mean_exec_time 
  FROM pg_stat_statements 
  ORDER BY mean_exec_time DESC LIMIT 10;

-- Check transaction log size
SELECT pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0'));
```

### Error Tracking

Monitor logs for errors:

```bash
# PM2
pm2 logs crown-api --err

# Docker
docker logs crown-api --tail 100 --follow
```

## Troubleshooting

### Database Connection Errors

```bash
# Test connection
psql -h prod-db.example.com -U crown_user -d crown_tap_game -c "SELECT 1"

# Check firewall
sudo ufw allow 5432/tcp from app-server-ip

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Migration Failures

```bash
# Check migration status
npm run prisma:migrate:status

# Resolve failed migration
npm run prisma:migrate:resolve --rolled-back MIGRATION_NAME
```

### High Memory Usage

```bash
# Restart application
pm2 restart crown-api

# Check for connection leaks in code
# Verify Prisma pool configuration
```

## Security Checklist

- [ ] Database password is strong (20+ characters, mixed case/numbers/symbols)
- [ ] JWT_SECRET is strong (64+ characters)
- [ ] HTTPS/SSL is configured and working
- [ ] Database backups are encrypted and stored securely
- [ ] Admin credentials are not in .env (use separate credentials management)
- [ ] Rate limiting is enabled on all endpoints
- [ ] CORS origin matches frontend domain exactly
- [ ] Security headers are set (via Helmet)
- [ ] Environment variables are not logged
- [ ] Database is not directly accessible from internet (use private subnet)
- [ ] Application runs as non-root user
- [ ] Dependencies are up-to-date (`npm audit`, `npm update`)

## Performance Optimization

### Database

```sql
-- Add missing indexes for common queries
CREATE INDEX idx_user_level ON "User"("level");
CREATE INDEX idx_transaction_user_date ON "Transaction"("userId", "createdAt");
CREATE INDEX idx_tap_user_timestamp ON "Tap"("userId", "serverTimestamp");
CREATE INDEX idx_referral_status_date ON "Referral"("status", "createdAt");

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM "User" WHERE "level" > 10;
```

### Application

- Increase connection pool size if many concurrent users
- Enable compression for API responses
- Cache game configuration (rarely changes)
- Use database connection pooling (pgBouncer)

## Scaling

### Horizontal Scaling (Multiple App Instances)

1. Use load balancer (Nginx, HAProxy, AWS ALB)
2. Stateless application design (already implemented)
3. Shared PostgreSQL database
4. Session/token storage in database (already implemented)

### Vertical Scaling (Larger Instance)

1. Increase CPU/RAM
2. Increase database connection pool
3. Optimize database indexes

## Maintenance Windows

For zero-downtime deployments:

```bash
# 1. Deploy new version to staging instance
# 2. Run database migrations (non-breaking)
# 3. Switch load balancer to new instance
# 4. Keep old instance running temporarily for rollback
```

## Support & Escalation

See log files in:
- PM2: `~/.pm2/logs/`
- Docker: `docker logs crown-api`

For production issues, check:
1. Health endpoint
2. Database connectivity
3. Error logs
4. Rate limit status
5. Telegram bot token validity
