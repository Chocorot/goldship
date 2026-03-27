# Goldship Mobile

Expo app for displaying live XAU/USD data from the gold-api service.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment variables in `.env`

   ```env
   EXPO_PUBLIC_GOLD_API_BASE=https://your-gold-api-host
   ```

   Optional overrides:

   ```env
   EXPO_PUBLIC_GOLD_API_LATEST=https://your-gold-api-host/api/gold
   EXPO_PUBLIC_GOLD_API_HISTORY=https://your-gold-api-host/api/gold/history
   EXPO_PUBLIC_GOLD_API_TRADING_DAY=https://your-gold-api-host/api/gold/trading-day
   EXPO_PUBLIC_GOLD_API_WS=wss://your-gold-api-host/ws/realtime
   ```

   Expo Web only (if your API does not return CORS headers):

   ```env
   EXPO_PUBLIC_WEB_CORS_PROXY=https://corsproxy.io/?
   ```

   You can also use a custom proxy pattern with `{url}` placeholder:

   ```env
   EXPO_PUBLIC_WEB_CORS_PROXY=https://your-proxy.example/fetch?target={url}
   ```

   Backward compatibility:
   If you already use `EXPO_PUBLIC_GOLD_API=https://your-gold-api-host/api/gold`,
   the app will auto-derive history and websocket URLs.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

The home screen shows:

- Realtime big number from `WS /ws/realtime` with subscribe payload `{ "action": "subscribe", "symbol": "XAU/USD" }`
- 1D graph from `GET /api/gold/trading-day` (with previous close reference line)
- Other ranges from `GET /api/gold/history?range=<interval>`
- Fallback latest snapshot from `GET /api/gold`

If running on web and you see CORS errors, configure `EXPO_PUBLIC_WEB_CORS_PROXY` or enable `Access-Control-Allow-Origin` on the API.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
