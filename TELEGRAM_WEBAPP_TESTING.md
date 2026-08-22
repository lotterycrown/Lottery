# Telegram WebApp Validation Checklist

Run these checks in Telegram WebView (not only in desktop/mobile browser):

- [ ] Open app via `https://t.me/<your_bot_username>/<mini_app_short_name>`
- [ ] Open app via `/startapp ref_TESTCODE` deep link and verify referral parameter handling
- [ ] Verify Telegram user context is available in app runtime
- [ ] Verify app loads over HTTPS with no mixed-content errors
- [ ] Verify API requests target production API URL
- [ ] Verify login/auth handshake succeeds for real Telegram session
- [ ] Verify tap gameplay remains unchanged in Telegram WebView
- [ ] Verify no UI overflow or touch issues on Android Telegram app
- [ ] Verify no UI overflow or touch issues on iOS Telegram app
- [ ] Verify app recovers cleanly after Telegram app background/foreground transitions
- [ ] Verify no critical console errors in production mode
