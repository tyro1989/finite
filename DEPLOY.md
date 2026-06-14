# Deploying Finite

Three ways to ship Finite, from easiest to most involved.

---

## 1. Web (already live)

```bash
railway up
```

Live at **https://web-production-a33b57.up.railway.app**. The Railway project is already linked, Postgres is attached, and `DATABASE_URL` is set as a service variable. Every `railway up` redeploys.

---

## 2. Install as a phone app (PWA — no stores, instant)

This works **today** with zero extra build steps because Finite is a full PWA.

**iOS (Safari only):** open the URL → Share → **Add to Home Screen**.
**Android (Chrome):** open the URL → menu (⋮) → **Install app** (or tap the install banner).

Gives a full-screen, offline-capable app icon. Best option unless you specifically need App Store / Play Store listings.

---

## 3. Native apps for the App Store & Play Store (Capacitor)

Capacitor is already configured (`capacitor.config.json`). It wraps the **live Railway web app** in a native shell, so auth + Postgres sync keep working with no bundled backend.

### One-time prerequisites
- **iOS:** macOS + Xcode (`xcode-select --install`), an Apple Developer account ($99/yr) to publish.
- **Android:** Android Studio + JDK 17, a Google Play Developer account ($25 once) to publish.

### Generate the native projects (first time only)
```bash
npm run build           # produce dist/
npx cap add ios         # creates ios/ (macOS only)
npx cap add android     # creates android/
```

### Open in the native IDE
```bash
npm run cap:ios         # builds, syncs, opens Xcode
npm run cap:android     # builds, syncs, opens Android Studio
```

Then press Run in Xcode / Android Studio to test on a simulator or device.

### Updating after code changes
Because `capacitor.config.json` points `server.url` at the live Railway URL, **most JS/UI changes ship by just running `railway up`** — the native shell loads the latest web app on next launch. Re-run `npm run cap:sync` only when you change native config, icons, or splash screens.

> To bundle the web assets **inside** the app instead of loading from Railway (works fully offline, but auth/sync still need network), remove the `server.url` block from `capacitor.config.json` and re-run `npm run cap:sync`.

### Publishing
- **iOS:** in Xcode, Product → Archive → distribute to App Store Connect.
- **Android:** in Android Studio, Build → Generate Signed Bundle (AAB) → upload to Play Console.

### Icons & splash (optional polish)
Put a 1024×1024 `icon.png` and splash in `resources/`, then:
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate
```

---

## Notes
- `ios/` and `android/` folders are generated and gitignored — regenerate with `npx cap add` on a fresh clone.
- App identity: `appId: app.finite.life`, `appName: Finite` (in `capacitor.config.json`).
- Keep `CONTEXT.md` as the architecture source of truth for agents.
