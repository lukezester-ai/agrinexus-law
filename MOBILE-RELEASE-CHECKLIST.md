# Mobile Release Checklist (Android + iOS)

Този проект вече е подготвен с Capacitor (`android/`, `ios/`) и production URL `https://agrinexuslaw.com`.

## 1) Преди build

- Увери се, че production сайтът работи стабилно.
- Обнови версия:
  - Android: `android/app/build.gradle` -> `versionCode` (увеличава се при всеки release), `versionName`
  - iOS: Xcode -> `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION`
- Синхронизирай web и native assets:

```bash
npm run build
npm run cap:sync
```

## 2) Android release (Google Play)

1. Отвори проекта:

```bash
npm run cap:android
```

2. В Android Studio:
- `Build > Generate Signed Bundle / APK`
- Избери **Android App Bundle (AAB)**.
- Използвай release keystore.

3. В Play Console:
- Създай app (ако е ново).
- Качи `.aab` в Production/Testing track.
- Попълни Data safety, Privacy policy, screenshots, App icon, Feature graphic.
- Изпрати за review.

## 3) iOS release (App Store)

1. На macOS отвори:

```bash
npm run cap:ios
```

2. В Xcode:
- Избери реално устройство / Any iOS Device.
- `Product > Archive`
- `Distribute App` към App Store Connect.

3. В App Store Connect:
- Създай версия.
- Добави screenshots, app description, privacy details.
- Избери build и изпрати за review.

## 4) Задължителни артефакти

- App icon (1024x1024 за store listing)
- Splash screen assets
- Privacy policy URL
- Support URL
- Коректен contact email

## 5) При всяка нова версия

1. Увеличи version/build номерата.
2. `npm run build`
3. `npm run cap:sync`
4. Генерирай нови release билдове.
