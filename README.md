# tcptun.com

Next.js static site for tcptun, published to [tcptun.com](https://tcptun.com/) via GitHub Pages.

Site copy and examples are based on the sibling `../tcptun-go` source. CLI / Android packages are built locally into `public/releases/` and ship with Pages.

## Local development

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
```

## Publish binaries to GitHub Pages

Run from the website repo root (defaults to sibling `../tcptun-go` and `../tcptun-kotlin`):

```bash
# Build Go (+ Android) into public/releases/<version>/ and latest/
./scripts/publish-pages-assets.sh --version v0.2.2

# Go only
./scripts/publish-pages-assets.sh --version v0.2.2 --only go

# Sync version and file sizes into app/site-data.ts
./scripts/publish-pages-assets.sh --version v0.2.2 --only go --update-site-data

# Skip build when dist / APKs already exist
./scripts/publish-pages-assets.sh --version v0.2.2 --skip-build
```

Then commit and push. The Pages workflow builds and deploys (`public/` is copied into `out/`):

```bash
git add public/releases app/site-data.ts public/install.sh
git commit -m "release: publish v0.2.2 assets"
git push origin main
```

Example URLs after deploy:

| Path | Description |
|------|-------------|
| `https://tcptun.com/releases/0.2.2/tcptun-linux-amd64` | Pinned version |
| `https://tcptun.com/releases/0.2.2/tcptun-android-arm64-v0.2.2.apk` | Android ARM64 APK |
| `https://tcptun.com/releases/0.2.2/tcptun-android-armv7-v0.2.2.apk` | Android ARMv7 APK |
| `https://tcptun.com/releases/0.2.2/tcptun-android-x86_64-v0.2.2.apk` | Android x86_64 APK |
| `https://tcptun.com/releases/latest/tcptun-linux-amd64` | Latest copy |
| `https://tcptun.com/install.sh` | One-line install (pulls binaries from `/releases/...`) |

```bash
curl -fsSL https://tcptun.com/install.sh | sh
TCPTUN_VERSION=0.2.2 sh -c "$(curl -fsSL https://tcptun.com/install.sh)"
```

Android builds need `signing.properties` or `TCPTUN_RELEASE_*` env vars in `tcptun-kotlin`.

## Site content

Pushing to `main` triggers `.github/workflows/pages.yml` to deploy the static site.
After a new release, update `public/releases/` with the script above and, if needed, the copy and version in `app/site-data.ts`.
