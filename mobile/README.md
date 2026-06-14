# ENTGO Mobile

Native iOS and Android client built with React Native, Expo SDK 56 and Expo Router.

## Local launch

Run the backend so it is reachable from the local network:

```bash
npm run dev:mobile
```

Then start Expo from the repository root:

```bash
npm run mobile:start
```

Open the QR code with Expo Go on a physical iPhone or Android device. The client automatically derives the backend host from the Expo development server. The phone and computer must be on the same network.

To use a fixed backend URL, create `mobile/.env.local`:

```dotenv
EXPO_PUBLIC_API_URL=https://entgo.kz
```

## Checks

```bash
npm run mobile:typecheck
npm --prefix mobile run export:web
npm --prefix mobile run doctor
```

## Builds

Install and authenticate the EAS CLI, then:

```bash
cd mobile
npx eas build --profile development --platform ios
npx eas build --profile preview --platform android
npx eas build --profile production --platform all
```

The identifiers are `kz.entgo.app` for both iOS and Android. Production builds must use an HTTPS API URL.
