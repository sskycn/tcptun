# tcptun.com

Next.js static site for tcptun, published to [tcptun.com](https://tcptun.com/) via GitHub Pages.

Site copy and examples track the sibling [`../tcptun-go`](../tcptun-go) source. **CLI binaries are not hosted on this site** — they ship inside the npm package [`tcptun`](https://www.npmjs.com/package/tcptun) and are linked from the download page.

## Local development

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
```

## Install / download

| Source | Description |
|--------|-------------|
| [npmjs.com/package/tcptun](https://www.npmjs.com/package/tcptun) | Package page |
| `https://registry.npmjs.org/tcptun/-/tcptun-<version>.tgz` | Full package tarball |
| `https://cdn.jsdelivr.net/npm/tcptun@<version>/dist/tcptun-linux-amd64` | Individual binary (from npm package files) |
| `https://tcptun.com/install.sh` | One-line installer (pulls binaries from the npm package via jsDelivr) |

```bash
# latest
curl -fsSL https://tcptun.com/install.sh | sh

# pin a version
curl -fsSL https://tcptun.com/install.sh | TCPTUN_VERSION=0.2.4 sh

# or npm
npm install -g tcptun@0.2.4
```

After a new `tcptun-go` release is published to npm:

1. Bump `releaseVersion` and binary sizes in `app/site-data.ts` (and any release notes copy).
2. Confirm `public/install.sh` still targets the npm package layout (`@version/dist/...`).
3. Commit and push — the Pages workflow deploys the static site only (no large binaries).

## Site content

Pushing to `main` triggers `.github/workflows/pages.yml` to deploy the static site.
