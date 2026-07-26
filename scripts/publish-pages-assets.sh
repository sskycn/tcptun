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
#   ./scripts/publish-pages-assets.sh --version v0.2.0 --prune-old
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
PRUNE_OLD=0

log() { printf '==> %s\n' "$*"; }
die() { printf 'publish-pages-assets: %s\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
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

read_property() {
  local key="$1"
  local file="$2"
  sed -n "s/^${key}=//p" "$file" | tail -n 1
}

android_sdk_dir() {
  local local_properties="$KOTLIN_DIR/local.properties"
  if [[ -n "${ANDROID_HOME:-}" ]]; then
    printf '%s\n' "$ANDROID_HOME"
  elif [[ -n "${ANDROID_SDK_ROOT:-}" ]]; then
    printf '%s\n' "$ANDROID_SDK_ROOT"
  elif [[ -f "$local_properties" ]]; then
    read_property sdk.dir "$local_properties"
  fi
}

latest_build_tool() {
  local tool="$1"
  local sdk_dir
  sdk_dir="$(android_sdk_dir)"
  [[ -n "$sdk_dir" && -d "$sdk_dir/build-tools" ]] || die "Android SDK build-tools not found"
  find "$sdk_dir/build-tools" -mindepth 2 -maxdepth 2 -type f -name "$tool" -print | sort | tail -n 1
}

signing_value() {
  local property_name="$1"
  local environment_name="$2"
  local signing_properties="$KOTLIN_DIR/signing.properties"
  local value="${!environment_name:-}"
  if [[ -z "$value" && -f "$signing_properties" ]]; then
    value="$(read_property "$property_name" "$signing_properties")"
  fi
  printf '%s\n' "$value"
}

build_split_apks() {
  local source_apk="$1"
  local zipalign apksigner store_file store_password key_alias key_password work_dir
  zipalign="$(latest_build_tool zipalign)"
  apksigner="$(latest_build_tool apksigner)"
  [[ -x "$zipalign" ]] || die "zipalign not found"
  [[ -x "$apksigner" ]] || die "apksigner not found"
  need_cmd zip
  need_cmd unzip

  store_file="$(signing_value storeFile TCPTUN_RELEASE_STORE_FILE)"
  store_password="$(signing_value storePassword TCPTUN_RELEASE_STORE_PASSWORD)"
  key_alias="$(signing_value keyAlias TCPTUN_RELEASE_KEY_ALIAS)"
  key_password="$(signing_value keyPassword TCPTUN_RELEASE_KEY_PASSWORD)"
  [[ -n "$store_file" && -n "$store_password" && -n "$key_alias" && -n "$key_password" ]] ||
    die "Android signing missing (signing.properties or TCPTUN_RELEASE_*)"
  [[ "$store_file" == /* ]] || store_file="$KOTLIN_DIR/$store_file"
  [[ -f "$store_file" ]] || die "Android keystore not found: $store_file"

  work_dir="$(mktemp -d "${TMPDIR:-/tmp}/tcptun-apk.XXXXXX")"
  trap 'rm -rf "$work_dir"' RETURN

  local label keep_abi output_name unsigned_apk aligned_apk present_abis
  local -a remove_patterns
  while IFS=: read -r label keep_abi; do
    case "$keep_abi" in
      arm64-v8a) remove_patterns=('lib/armeabi-v7a/*' 'lib/x86_64/*') ;;
      armeabi-v7a) remove_patterns=('lib/arm64-v8a/*' 'lib/x86_64/*') ;;
      x86_64) remove_patterns=('lib/arm64-v8a/*' 'lib/armeabi-v7a/*') ;;
      *) die "unsupported Android ABI: $keep_abi" ;;
    esac
    unsigned_apk="$work_dir/$label-unsigned.apk"
    aligned_apk="$work_dir/$label-aligned.apk"
    output_name="tcptun-android-${label}-v${VERSION}.apk"
    cp "$source_apk" "$unsigned_apk"
    zip -q -d "$unsigned_apk" "${remove_patterns[@]}"
    "$zipalign" -f -P 16 4 "$unsigned_apk" "$aligned_apk"
    TCPTUN_APK_STORE_PASSWORD="$store_password" TCPTUN_APK_KEY_PASSWORD="$key_password" \
      "$apksigner" sign \
        --ks "$store_file" \
        --ks-key-alias "$key_alias" \
        --ks-pass env:TCPTUN_APK_STORE_PASSWORD \
        --key-pass env:TCPTUN_APK_KEY_PASSWORD \
        --v4-signing-enabled false \
        --out "$OUT_DIR/$output_name" \
        "$aligned_apk"
    "$apksigner" verify --verbose "$OUT_DIR/$output_name" >/dev/null
    present_abis="$(unzip -Z1 "$OUT_DIR/$output_name" | sed -n 's|^lib/\([^/]*\)/.*|\1|p' | sort -u)"
    [[ "$present_abis" == "$keep_abi" ]] || die "$output_name contains unexpected ABIs: $present_abis"
  done <<'EOF'
arm64:arm64-v8a
armv7:armeabi-v7a
x86_64:x86_64
EOF

  rm -rf "$work_dir"
  trap - RETURN
}

prune_old_releases() {
  local release_dir base
  shopt -s nullglob
  for release_dir in "$SITE_ROOT"/public/releases/*; do
    [[ -d "$release_dir" ]] || continue
    base="$(basename "$release_dir")"
    [[ "$base" == "latest" || "$base" == "$VERSION" ]] && continue
    if [[ "$base" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][A-Za-z0-9.-]+)?$ ]]; then
      log "Removing old release → public/releases/$base/"
      rm -rf "$release_dir"
    fi
  done
  shopt -u nullglob
}

check_github_file_sizes() {
  local file size limit=$((100 * 1024 * 1024))
  while IFS= read -r -d '' file; do
    size="$(file_size "$file")"
    (( size <= limit )) || die "$(basename "$file") is $size bytes; GitHub rejects files over 100 MiB"
  done < <(find "$SITE_ROOT/public/releases" -type f -print0)
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
    --prune-old) PRUNE_OLD=1; shift ;;
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

  log "Creating signed per-ABI APKs"
  rm -f "$OUT_DIR"/*.apk "$OUT_DIR"/*.apk.idsig
  build_split_apks "$apk_src"
fi

[[ "$PRUNE_OLD" -eq 1 ]] && prune_old_releases

log "Writing SHA256SUMS"
write_sha256sums "$OUT_DIR"

if [[ "$SET_LATEST" -eq 1 ]]; then
  latest="$SITE_ROOT/public/releases/latest"
  log "Updating public/releases/latest → $VERSION"
  rm -rf "$latest"
  mkdir -p "$latest"
  # Copy the complete current release into the stable latest path.
  cp -R "$OUT_DIR"/. "$latest"/
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

  # Android filenames include the release version.
  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' -E 's/(tcptun-android-(arm64|armv7|x86_64)-v)[^"]+(\.apk)/\1'"${VERSION}"'\3/g' "$site_data"
  else
    sed -i -E 's/(tcptun-android-(arm64|armv7|x86_64)-v)[^"]+(\.apk)/\1'"${VERSION}"'\3/g' "$site_data"
  fi

  # Sizes for known release binaries.
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
    [[ "$base" == SHA256SUMS ]] && continue
    size="$(file_size "$bin")"
    update_size_line "$base" "$size" "$site_data" || true
  done
  shopt -u nullglob
fi

check_github_file_sizes

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
