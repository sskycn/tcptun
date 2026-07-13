#!/bin/sh

set -eu

package="tcptun"
version="${TCPTUN_VERSION:-latest}"
install_dir="${TCPTUN_INSTALL_DIR:-/usr/local/bin}"

fail() {
  printf 'tcptun installer: %s\n' "$*" >&2
  exit 1
}

case "$version" in
  v*) version=${version#v} ;;
esac

case "$version" in
  ""|*[!A-Za-z0-9._-]*)
    fail "invalid TCPTUN_VERSION: $version"
    ;;
esac

case "$install_dir" in
  /*) ;;
  *) fail "TCPTUN_INSTALL_DIR must be an absolute path" ;;
esac

kernel=$(uname -s 2>/dev/null) || fail "cannot detect operating system"
machine=$(uname -m 2>/dev/null) || fail "cannot detect CPU architecture"
suffix=""

case "$kernel" in
  Darwin) platform="darwin" ;;
  Linux) platform="linux" ;;
  MINGW*|MSYS*|CYGWIN*)
    platform="windows"
    suffix=".exe"
    ;;
  *) fail "unsupported operating system: $kernel" ;;
esac

case "$machine" in
  x86_64|amd64) arch="amd64" ;;
  arm64|aarch64) arch="arm64" ;;
  armv7|armv7l) arch="armv7" ;;
  *) fail "unsupported CPU architecture: $machine" ;;
esac

if [ "$arch" = "armv7" ] && [ "$platform" != "linux" ]; then
  fail "unsupported platform and architecture: $platform/$arch"
fi

filename="tcptun-${platform}-${arch}${suffix}"
url="https://unpkg.com/${package}@${version}/dist/${filename}"

tmp_dir=$(mktemp -d 2>/dev/null || mktemp -d -t tcptun) || fail "cannot create temporary directory"
tmp_binary="$tmp_dir/$filename"

cleanup() {
  rm -rf "$tmp_dir"
}

trap cleanup EXIT
trap 'exit 1' HUP INT TERM

printf 'Downloading %s (%s/%s) from npm...\n' "$package@$version" "$platform" "$arch"
attempt=1
downloaded=0
if command -v curl >/dev/null 2>&1; then
  while [ "$attempt" -le 5 ]; do
    if curl --proto '=https' --tlsv1.2 -C - -fsSL "$url" -o "$tmp_binary"; then
      downloaded=1
      break
    fi
    printf 'Download interrupted; resuming (%s/5)...\n' "$attempt" >&2
    attempt=$((attempt + 1))
  done
elif command -v wget >/dev/null 2>&1; then
  while [ "$attempt" -le 5 ]; do
    if wget -c -q "$url" -O "$tmp_binary"; then
      downloaded=1
      break
    fi
    printf 'Download interrupted; resuming (%s/5)...\n' "$attempt" >&2
    attempt=$((attempt + 1))
  done
else
  fail "curl or wget is required"
fi
[ "$downloaded" -eq 1 ] || fail "failed to download $url"

chmod 0755 "$tmp_binary"
destination="$install_dir/tcptun${suffix}"

if [ ! -d "$install_dir" ]; then
  if ! mkdir -p "$install_dir" 2>/dev/null; then
    command -v sudo >/dev/null 2>&1 || fail "cannot create $install_dir; set TCPTUN_INSTALL_DIR to a writable directory"
    sudo mkdir -p "$install_dir"
  fi
fi

if [ -w "$install_dir" ]; then
  install -m 0755 "$tmp_binary" "$destination"
else
  command -v sudo >/dev/null 2>&1 || fail "cannot write to $install_dir; set TCPTUN_INSTALL_DIR to a writable directory"
  sudo install -m 0755 "$tmp_binary" "$destination"
fi

installed_version=$($destination version 2>/dev/null) || fail "installed binary did not run successfully"
case "$version" in
  [0-9]*)
    [ "$installed_version" = "v$version" ] || fail "expected v$version, installed $installed_version"
    ;;
esac

printf 'Installed tcptun %s to %s\n' "$installed_version" "$destination"
case ":${PATH:-}:" in
  *:"$install_dir":*) ;;
  *) printf 'Add %s to PATH before running tcptun.\n' "$install_dir" ;;
esac
