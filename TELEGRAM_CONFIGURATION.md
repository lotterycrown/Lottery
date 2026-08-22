# Telegram Mini App Configuration

## Manual Action Required (BotFather)

1. Create bot with `@BotFather`:
   - `/newbot`
   - Save token to `TELEGRAM_BOT_TOKEN`

2. Create Mini App:
   - `/newapp`
   - Select your bot
   - Set app name and short name
   - Set URL to `https://yourdomain.com/app`

3. Configure commands:
   - `/setcommands`
   - Add `/start` for referral/start handling

4. Configure `startapp` referral flow:
   - Support `startapp=ref_CODE`
   - Validate referral payload server-side after Telegram auth verification

5. Configure webhook (if bot webhook flow is used):
   - `/setwebhook`
   - `https://api.yourdomain.com/api/telegram/webhook`
   - No certificate upload needed when HTTPS cert is trusted

## Required Values

```text
TELEGRAM_BOT_TOKEN: <from BotFather>
TELEGRAM_BOT_USERNAME: <from BotFather>
MINI_APP_NAME: <from BotFather>
MINI_APP_URL: https://yourdomain.com/app
```
