# Environment Variables for Crown Tap Game Backend

## Required Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://crown_user:securepass123@db.example.com:5432/crown_tap_game`

### Authentication
- `JWT_SECRET` - Secret key for signing JWT tokens
  - Min 32 characters, should be cryptographically random
  - Generate: `openssl rand -base64 32`
- `JWT_EXPIRY` - JWT token expiration time
  - Default: `7d`
  - Formats: `30m`, `2h`, `7d`, `30d`

### Telegram
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
  - Format: `123456789:ABCdefGHIjklmNOPqrsTUVwxyZ`
- `TELEGRAM_BOT_USERNAME` - Bot username (without @)
  - Example: `crown_tap_bot`
- `TELEGRAM_MINI_APP_URL` - Production URL of Mini App
  - Example: `https://yourdomain.com/app`
- `TELEGRAM_WEBHOOK_SECRET` - Secret for webhook verification
  - Generate: `openssl rand -base64 32`

### Server
- `NODE_ENV` - Environment mode
  - Options: `development`, `production`
  - Default: `development`
- `PORT` - Server port
  - Default: `3001`
- `API_URL` - Public API URL
  - Example: `https://api.yourdomain.com`
- `FRONTEND_URL` - Frontend application URL
  - Example: `https://yourdomain.com/app`
  - Used for CORS configuration

### Logging
- `LOG_LEVEL` - Minimum log level
  - Options: `debug`, `info`, `warn`, `error`
  - Default: `info`

## Optional Variables

### Reward Configuration (Override Defaults)
- `TAP_REWARD` - Coins per tap (micro-units)
  - Default: `1000` (0.001 coins)
- `TASK_REWARD_SMALL` - Small task reward
  - Default: `50000`
- `TASK_REWARD_MEDIUM` - Medium task reward
  - Default: `100000`
- `TASK_REWARD_LARGE` - Large task reward
  - Default: `250000`
- `AD_REWARD` - Reward per ad view
  - Default: `10000`
- `REFERRAL_REWARD` - Referral reward
  - Default: `500000`
- `REFERRAL_BONUS_REWARD` - Bonus for referrer milestone
  - Default: `1000000`

### XP Configuration
- `XP_PER_TAP` - XP awarded per tap
  - Default: `1`
- `XP_PER_TASK_SMALL` - XP for small task
  - Default: `10`
- `XP_PER_TASK_MEDIUM` - XP for medium task
  - Default: `25`
- `XP_PER_TASK_LARGE` - XP for large task
  - Default: `50`
- `XP_PER_AD` - XP per ad view
  - Default: `5`

### Limits & Cooldowns
- `MAX_TAPS_PER_HOUR` - Maximum taps per hour
  - Default: `3600`
- `TAP_COOLDOWN_MS` - Minimum milliseconds between taps
  - Default: `100`
- `TASK_CLAIM_COOLDOWN_HOURS` - Hours before task can be claimed again
  - Default: `24`

### Ad Provider Configuration
- `AD_PROVIDER` - Ad provider to use
  - Options: `none`, `admob`, `applovin`, `unity_ads`
  - Default: `none`
- `AD_PROVIDER_API_KEY` - API key for ad provider
- `AD_PROVIDER_NETWORK_ID` - Network ID from ad provider

## Environment-Specific Examples

### Development (.env.local)
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crown_dev
JWT_SECRET=dev-secret-not-secure-for-production
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklmNOPqrsTUVwxyZ
TELEGRAM_BOT_USERNAME=crown_tap_bot_dev
TELEGRAM_MINI_APP_URL=http://localhost:3000/app
LOG_LEVEL=debug
AD_PROVIDER=none
```

### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://crown_user:STRONG_PASSWORD@prod-db.example.com:5432/crown_tap_game
JWT_SECRET=$(openssl rand -base64 32)
PORT=3001
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com/app
TELEGRAM_BOT_TOKEN=PROD_BOT_TOKEN_FROM_BOTFATHER
TELEGRAM_BOT_USERNAME=crown_tap_bot
TELEGRAM_MINI_APP_URL=https://yourdomain.com/app
TELEGRAM_WEBHOOK_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
AD_PROVIDER=none
# Reward overrides if different from defaults
TAP_REWARD=1000
REFERRAL_REWARD=500000
```

## Validation

Before starting the server, verify:

```bash
# Check all required variables are set
echo $DATABASE_URL | grep postgresql  # Should not be empty
echo $JWT_SECRET | wc -c  # Should be > 32 characters
echo $TELEGRAM_BOT_TOKEN | grep -E '^[0-9]+:[A-Za-z0-9_-]+$'  # Valid format
```

## Security Notes

1. **Never commit `.env` files to git**
   - Use `.gitignore` to exclude
   - Share `.env.example` only

2. **Rotate secrets regularly**
   - JWT_SECRET
   - TELEGRAM_WEBHOOK_SECRET
   - Database password

3. **Use secure secret management**
   - Heroku Config Vars
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets
   - Environment variable injection at runtime

4. **Principle of least privilege**
   - Database user should only have necessary permissions
   - Telegram bot should only have required scopes
   - API credentials should be specific to environments

5. **Audit secret access**
   - Log who accessed secrets
   - Rotate when team members leave
   - Use separate credentials per environment

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Check network connectivity
- Verify database user permissions

### "Invalid JWT token"
- Ensure `JWT_SECRET` is consistent across deployments
- Check token hasn't expired
- Verify token format

### "Telegram verification failed"
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check token hasn't been revoked by BotFather
- Verify webhook secret format

### "CORS errors"
- Ensure `FRONTEND_URL` matches exact frontend domain
- Check both URLs use HTTPS in production
- Verify no trailing slashes

## Performance Tuning

For high-traffic deployments, consider:

```env
# Database connection pool
DATABASE_URL=postgresql://...?connection_limit=20&pool_timeout=10&statement_timeout=30000

# Rate limiting (adjust based on user base)
MAX_TAPS_PER_HOUR=3600

# Ad display frequency
AD_REWARD=10000
AD_PROVIDER=admob  # When provider is configured
```
