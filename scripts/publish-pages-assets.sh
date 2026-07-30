#!/usr/bin/env bash
# Deprecated: CLI binaries are published to npm from tcptun-go, not to GitHub Pages.
#
# Historical script built go (+ optional Android APK) into public/releases/ for Pages.
# That path is intentionally empty now — the site links to npm package files instead.
#
# After a tcptun-go release is on npm:
#   1. Update app/site-data.ts releaseVersion + binary() sizes
#   2. Refresh release notes / install copy if needed
#   3. git commit && git push   # Pages deploys the static site only
#
# Binary URLs used by the site:
#   https://cdn.jsdelivr.net/npm/tcptun@<version>/dist/tcptun-<platform>-<arch>
#   https://registry.npmjs.org/tcptun/-/tcptun-<version>.tgz
#   https://www.npmjs.com/package/tcptun

set -euo pipefail

cat <<'EOF' >&2
publish-pages-assets.sh is deprecated.

Binaries ship via the npm package "tcptun" from the tcptun-go repo.
Update app/site-data.ts (version + sizes) and redeploy the site.
Do not copy multi-megabyte binaries into public/releases/.
EOF
exit 1
