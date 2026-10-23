# Releasing to the App Store and Google Play

The app uses Continuous Native Generation: `ios/` and `android/` are generated
by `expo prebuild` at build time and are never committed. Store builds run on
GitHub Actions with `eas build --local` (the build happens on the GitHub
runner, not on EAS servers), and the binaries are uploaded with EAS Submit.

Workflow: [`.github/workflows/release-mobile.yml`](../.github/workflows/release-mobile.yml)

| Platform | Runner           | Output         | Goes to                               |
| -------- | ---------------- | -------------- | ------------------------------------- |
| Android  | `ubuntu-latest`  | `.aab`         | Google Play, internal track, as draft |
| iOS      | `macos-26`       | `.ipa`         | App Store Connect / TestFlight        |

## How to release

1. Bump `expo.version` in `app.json` when you ship a new user-facing version
   (for example `1.0.0` → `1.1.0`). Build numbers (`ios.buildNumber`,
   `android.versionCode`) are stored on EAS and go up by one on every
   production build, so you never edit them.
2. Either push a tag (`git tag v1.1.0 && git push origin v1.1.0`) to build and
   submit both platforms, or run **Release mobile apps** from the Actions tab
   and pick the platform and whether to submit.
3. The `.aab` / `.ipa` are also attached to the run as artifacts for 14 days.
4. Promote the build in the store consoles: add it to a TestFlight group or an
   App Store version, and roll the Play internal release out to other tracks.

## One-time setup

Run the CLI commands from your own machine in the repo root (`bunx eas-cli`
works if you don't install `eas-cli` globally).

### Accounts

- [ ] **Expo account** (free). `bunx eas-cli login`.
- [ ] **Apple Developer Program** membership ($99/year).
- [ ] **Google Play Console** developer account ($25 one-time). New personal
      accounts must pass Google's closed testing requirement before they can
      publish to production.

### Link the project to EAS

- [x] EAS project created (slug `pokedex`); its ID is in
      `extra.eas.projectId` in `app.json`. If the project lives under an Expo
      organization rather than your personal account, also add
      `"owner": "<org name>"` to `app.json`.
- [ ] Check the bundle ID / package name. Both are set to
      `com.jameslporter.pokedex` in `app.json`. They can't be changed after the
      first store upload, so change them now if you want something else.

### Signing credentials (stored on EAS, downloaded by the CI build)

- [ ] **Android upload keystore:** `bunx eas-cli credentials -p android` →
      production → generate a new keystore. Download a backup copy and keep it
      somewhere safe.
- [ ] **iOS distribution certificate and provisioning profile:**
      `bunx eas-cli credentials -p ios` → production → sign in with your Apple
      ID and let EAS create them. This also registers the bundle ID with Apple.

### Store listings and submit credentials

- [ ] **App Store Connect app:** create the app in App Store Connect
      (My Apps → + → New App) with bundle ID `com.jameslporter.pokedex`. Copy
      its **Apple ID** (App Information → General Information) into
      `submit.production.ios.ascAppId` in `eas.json` and commit it.
- [ ] **App Store Connect API key for EAS Submit:**
      `bunx eas-cli credentials -p ios` → production → *App Store Connect:
      Manage your API Key* → *Set up your project to use an API Key for EAS
      Submit*. EAS stores the key, so CI needs no Apple secrets.
- [ ] **Google Play app:** create the app in Play Console with package name
      `com.jameslporter.pokedex`.
- [ ] **Google service account key for EAS Submit:** create a service account
      in Google Cloud with access to your Play Console app
      ([guide](https://github.com/expo/fyi/blob/main/creating-google-service-account.md)),
      download its JSON key, then upload it with
      `bunx eas-cli credentials -p android` → production → *Google Service
      Account* (or in the EAS dashboard). CI needs no Google secrets.

### GitHub

- [ ] **`EXPO_TOKEN` repository secret:** create a personal access token at
      expo.dev → Account settings → Access tokens, then add it in the repo's
      Settings → Secrets and variables → Actions as `EXPO_TOKEN`. This is the
      only secret the workflow uses.

### Before the first public release

These live in the store consoles, not in the repo: app description,
screenshots, privacy policy URL, App Privacy / Data safety forms, age rating,
and content rating. The app stores favorites on the device only and collects
no user data, which keeps those forms short.

## Notes

- `eas build --local` downloads the signing credentials from EAS and runs the
  build on the runner, so build minutes are GitHub Actions minutes, not EAS
  build credits. macOS minutes count 10× against private repo quotas.
- The `preview` profile in `eas.json` makes an installable Android `.apk` for
  sideloading: `bunx eas-cli build -p android --profile preview --local`.
- Google only accepts `draft` releases until the app has been published once.
  After the first review, you can change `releaseStatus` in `eas.json` to
  `completed` to roll out automatically.
