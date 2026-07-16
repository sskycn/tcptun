#!/usr/bin/env bash
# Build tcptun-go (+ optional Android APK) locally and place assets under
# public/releases/ for GitHub Pages deployment.
#
# Usage:
#   ./scripts/publish-pages-assets.sh --version v0.2.0
#   ./scripts/publish-pages-assets.sh --version 0.2.0 --only go
#   ./scripts/publish-pages-assets.sh --version v0.2.0 --only android
#   ./scripts/publish-pages-assets.sh --version v0.2.0 --skip-build
#   ./scripts/publish-pages-assets.sh --version v0.2.0 --update-site-data
#
# After this script:
#   git add public/releases app/site-data.ts
#   git commit && git push   # Pages workflow deploys out/ including public/
#
# Env:
#   TCPTUN_GO_DIR, TCPTUN_KOTLIN_DIR

set -euo pipefail

SITE_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
GO_DIR="${TCPTUN_GO_DIR:-$SITE_ROOT/../tcptun-go}"
KOTLIN_DIR="${TCPTUN_KOTLIN_DIR:-$SITE_ROOT/../tcptun-kotlin}"

VERSION=""
ONLY="both" # both | go | android
SKIP_BUILD=0
UPDATE_SITE_DATA=0
SET_LATEST=1

log() { printf '==> %s\n' "$*"; }
die() { printf 'publish-pages-assets: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

normalize_version() {
  local v="$1"
  [[ -n "$v" ]] || die "--version is required (e.g. v0.2.0)"
  case "$v" in
    v*) printf '%s\n' "${v#v}" ;;
    *) printf '%s\n' "$v" ;;
  esac
}

version_code_from_semver() {
  local raw="$1"
  local major minor patch
  if [[ ! "$raw" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)([-+].*)?$ ]]; then
    die "version must be semver like 1.2.3 (got: $1)"
  fi
  major="${BASH_REMATCH[1]}"
  minor="${BASH_REMATCH[2]}"
  patch="${BASH_REMATCH[3]}"
  if (( 10#$minor > 999 || 10#$patch > 999 )); then
    die "minor/patch must be <= 999 for Android versionCode"
  fi
  echo $((10#$major * 1000000 + 10#$minor * 1000 + 10#$patch))
}

file_size() {
  local file="$1"
  if stat -f%z "$file" >/dev/null 2>&1; then
    stat -f%z "$file"
  else
    stat -c%s "$file"
  fi
}

write_sha256sums() {
  local dir="$1"
  (
    cd "$dir"
    files=$(find . -maxdepth 1 -type f ! -name SHA256SUMS -print | sed 's|^\./||' | sort)
    # shellcheck disable=SC2086
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum -- $files >SHA256SUMS
    else
      shasum -a 256 -- $files >SHA256SUMS
    fi
  )
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --version) VERSION="${2:-}"; shift 2 ;;
    --only) ONLY="${2:-}"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --update-site-data) UPDATE_SITE_DATA=1; shift ;;
    --no-latest) SET_LATEST=0; shift ;;
    --go-dir) GO_DIR="${2:-}"; shift 2 ;;
    --kotlin-dir) KOTLIN_DIR="${2:-}"; shift 2 ;;
    *) die "unknown argument: $1" ;;
  esac
done

VERSION="$(normalize_version "$VERSION")"
case "$ONLY" in
  both|go|android) ;;
  *) die "--only must be both, go, or android" ;;
esac

do_go=0
do_android=0
[[ "$ONLY" == "both" || "$ONLY" == "go" ]] && do_go=1
[[ "$ONLY" == "both" || "$ONLY" == "android" ]] && do_android=1

OUT_DIR="$SITE_ROOT/public/releases/$VERSION"
mkdir -p "$OUT_DIR"

# ---------- go ----------
if [[ "$do_go" -eq 1 ]]; then
  [[ -d "$GO_DIR" ]] || die "tcptun-go not found: $GO_DIR"
  need_cmd go
  need_cmd make

  if [[ "$SKIP_BUILD" -eq 0 ]]; then
    log "Building tcptun-go binaries"
    make -C "$GO_DIR" release
  else
    log "Skip go build; using $GO_DIR/dist"
  fi
  [[ -d "$GO_DIR/dist" ]] || die "missing $GO_DIR/dist"

  shopt -s nullglob
  bins=("$GO_DIR"/dist/tcptun-*)
  shopt -u nullglob
  ((${#bins[@]} > 0)) || die "no binaries in $GO_DIR/dist"

  log "Copying go binaries → public/releases/$VERSION/"
  for bin in "${bins[@]}"; do
    base="$(basename "$bin")"
    # Makefile uses tcptun-linux-armv7; site expects tcptun-linux-armv7
    cp "$bin" "$OUT_DIR/$base"
    chmod 755 "$OUT_DIR/$base" 2>/dev/null || true
    # windows exe stays non-executable bit irrelevant
  done
fi

# ---------- android ----------
if [[ "$do_android" -eq 1 ]]; then
  [[ -d "$KOTLIN_DIR" ]] || die "tcptun-kotlin not found: $KOTLIN_DIR"

  apk_src="$KOTLIN_DIR/app/build/outputs/apk/release/app-release.apk"
  if [[ "$SKIP_BUILD" -eq 0 ]]; then
    if [[ ! -f "$KOTLIN_DIR/signing.properties" ]]; then
      if [[ -z "${TCPTUN_RELEASE_STORE_FILE:-}" || -z "${TCPTUN_RELEASE_STORE_PASSWORD:-}" || -z "${TCPTUN_RELEASE_KEY_ALIAS:-}" || -z "${TCPTUN_RELEASE_KEY_PASSWORD:-}" ]]; then
        die "Android signing missing (signing.properties or TCPTUN_RELEASE_*)."
      fi
    fi
    version_code="$(version_code_from_semver "$VERSION")"
    log "Building Android APK ($VERSION / code $version_code)"
    (
      cd "$KOTLIN_DIR"
      ./gradlew :app:assembleRelease \
        -PreleaseVersionName="$VERSION" \
        -PreleaseVersionCode="$version_code"
    )
  else
    log "Skip android build"
  fi
  [[ -f "$apk_src" ]] || die "APK not found: $apk_src"

  apk_name="tcptun-${VERSION}.apk"
  log "Copying $apk_name"
  cp "$apk_src" "$OUT_DIR/$apk_name"
fi

log "Writing SHA256SUMS"
write_sha256sums "$OUT_DIR"

if [[ "$SET_LATEST" -eq 1 ]]; then
  latest="$SITE_ROOT/public/releases/latest"
  log "Updating public/releases/latest → $VERSION"
  rm -rf "$latest"
  mkdir -p "$latest"
  # copy files; for "latest" also alias versioned apk name
  cp -R "$OUT_DIR"/. "$latest"/
  # stable latest apk name
  if [[ -f "$OUT_DIR/tcptun-${VERSION}.apk" ]]; then
    cp "$OUT_DIR/tcptun-${VERSION}.apk" "$latest/tcptun-latest.apk"
  fi
  # pointer file for humans / scripts
  printf '%s\n' "$VERSION" >"$SITE_ROOT/public/releases/latest/VERSION"
fi

if [[ "$UPDATE_SITE_DATA" -eq 1 ]]; then
  site_data="$SITE_ROOT/app/site-data.ts"
  [[ -f "$site_data" ]] || die "missing $site_data"

  log "Updating app/site-data.ts releaseVersion + binary sizes"
  # version
  if grep -q 'export const releaseVersion' "$site_data"; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' -E "s/export const releaseVersion = \"[^\"]+\";/export const releaseVersion = \"${VERSION}\";/" "$site_data"
    else
      sed -i -E "s/export const releaseVersion = \"[^\"]+\";/export const releaseVersion = \"${VERSION}\";/" "$site_data"
    fi
  fi

  # sizes for known go binaries
  update_size_line() {
    local filename="$1"
    local size="$2"
    local file="$3"
    # binary("name", ..., size),
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' -E "s/(binary\(\"${filename//\//\\/}\"[^,]*,[^,]*,[^,]*,[^,]*,[^,]*, )[0-9_]+(\))/\1${size}\2/" "$file"
    else
      sed -i -E "s/(binary\(\"${filename//\//\\/}\"[^,]*,[^,]*,[^,]*,[^,]*,[^,]*, )[0-9_]+(\))/\1${size}\2/" "$file"
    fi
  }

  shopt -s nullglob
  for bin in "$OUT_DIR"/tcptun-*; do
    base="$(basename "$bin")"
    [[ "$base" == *.apk ]] && continue
    [[ "$base" == SHA256SUMS ]] && continue
    size="$(file_size "$bin")"
    update_size_line "$base" "$size" "$site_data" || true
  done
  shopt -u nullglob
fi

log "Assets ready under public/releases/$VERSION/"
ls -lh "$OUT_DIR" | sed '1d' || true

cat <<EOF

Next steps (deploy via GitHub Pages):

  cd $SITE_ROOT
  git add public/releases
  # if you used --update-site-data:
  # git add app/site-data.ts public/install.sh
  git status
  git commit -m "release: publish $VERSION assets to Pages"
  git push origin main

Download URLs after deploy:

  https://tcptun.com/releases/${VERSION}/tcptun-linux-amd64
  https://tcptun.com/releases/latest/tcptun-linux-amd64
  curl -fsSL https://tcptun.com/install.sh | sh

EOF
