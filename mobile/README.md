# FinderB Mobile

React Native (Expo) app for FinderB. Sibling to the Next.js web app in the repo root.

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on your phone (fastest way to try screens), **or** Android Studio / emulator
- Free [Expo account](https://expo.dev/signup) when you want a cloud APK build

## Run locally

```bash
cd mobile
npm install
npm start
```

Then:

- scan the QR code with **Expo Go** (Android), or
- press `a` for Android emulator, or
- press `w` for web preview

## Screens (starter)

| Route   | File            | Notes                                      |
|---------|-----------------|--------------------------------------------|
| `/`     | `app/index.tsx` | Home / welcome                             |
| `/login`| `app/login.tsx` | Placeholder sign-in (no real auth yet)     |

Brand colors live in `constants/colors.ts` (same palette as the web app).

## Export an APK

### Local APK (Windows — recommended for you)

Make sure Android Studio / SDK is installed, then in PowerShell:

```powershell
cd mobile
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
npm run build:apk:gradle
```

APK output:

`mobile/android/app/build/outputs/apk/release/app-release.apk`

Or one-shot with Expo:

```powershell
npx expo run:android --variant release
```

### Option A — EAS cloud build

```bash
cd mobile
npx eas-cli login
npm run build:apk
```

### Option B — EAS local (same machine)

```bash
npm run build:apk:local
```

Requires Android SDK + Java 17. On some Windows setups Gradle (`build:apk:gradle`) is smoother.
## Gradual roadmap

1. Polish Home + Login UI  
2. Connect auth to existing FinderB / Supabase backend  
3. Business search & detail screens  
4. Push notifications, deep links, store release  

Keep the web app and this `mobile/` app separate for now; share API contracts as you grow.
