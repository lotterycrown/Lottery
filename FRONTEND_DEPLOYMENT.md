# Frontend Production Build Guide

## Build Configuration

- Vite production build enabled
- API/client URL constants injected at build time
- Sourcemaps disabled in production
- Asset minification enabled (`terser`)
- Vendor chunk split for `react` and `react-dom`

## Environment Configuration

Create `.env.production` in deployment environment:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_CLIENT_URL=https://yourdomain.com
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_MINI_APP_NAME=your_mini_app_name
```

## Build Steps

```bash
npm run build
```

Output: optimized assets in `dist/`.

## Build Verification Checklist

- [ ] No console/runtime errors in production build
- [ ] All expected assets emitted to `dist/`
- [ ] Bundle size remains reasonable
- [ ] Sourcemaps disabled
- [ ] Environment values are injected correctly
- [ ] API calls target production API URL
- [ ] Telegram Mini App parameters are correct
