# tcptun.com

tcptun 的 Next.js 静态网站，通过 GitHub Pages 发布到 [tcptun.com](https://tcptun.com/)。

网站说明与示例依据同级 `../tcptun-go` 源码整理。CLI / Android 安装包由本机编译后放入 `public/releases/`，随 Pages 一起上线。

## 本地开发

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

## 发布二进制到 GitHub Pages

在网站仓库根目录执行（默认读取同级 `../tcptun-go`、`../tcptun-kotlin`）：

```bash
# 编译 Go（+ Android）并写入 public/releases/<version>/ 与 latest/
./scripts/publish-pages-assets.sh --version v0.2.2

# 只编译 Go
./scripts/publish-pages-assets.sh --version v0.2.2 --only go

# 同步版本号与文件大小到 app/site-data.ts
./scripts/publish-pages-assets.sh --version v0.2.2 --only go --update-site-data

# 已有 dist / APK 时跳过编译
./scripts/publish-pages-assets.sh --version v0.2.2 --skip-build
```

然后提交并推送，Pages workflow 会构建并部署（`public/` 会进入 `out/`）：

```bash
git add public/releases app/site-data.ts public/install.sh
git commit -m "release: publish v0.2.2 assets"
git push origin main
```

上线后地址示例：

| 路径 | 说明 |
|------|------|
| `https://tcptun.com/releases/0.2.2/tcptun-linux-amd64` | 固定版本 |
| `https://tcptun.com/releases/0.2.2/tcptun-android-arm64-v0.2.2.apk` | Android ARM64 APK |
| `https://tcptun.com/releases/0.2.2/tcptun-android-armv7-v0.2.2.apk` | Android ARMv7 APK |
| `https://tcptun.com/releases/0.2.2/tcptun-android-x86_64-v0.2.2.apk` | Android x86_64 APK |
| `https://tcptun.com/releases/latest/tcptun-linux-amd64` | 最新副本 |
| `https://tcptun.com/install.sh` | 一键安装（从 `/releases/...` 拉二进制） |

```bash
curl -fsSL https://tcptun.com/install.sh | sh
TCPTUN_VERSION=0.2.2 sh -c "$(curl -fsSL https://tcptun.com/install.sh)"
```

Android 需在 `tcptun-kotlin` 配置 `signing.properties` 或 `TCPTUN_RELEASE_*` 环境变量。

## 网站内容

推送到 `main` 会触发 `.github/workflows/pages.yml` 部署静态站。  
发新版本后请用上面的脚本更新 `public/releases/`，并视需要改 `app/site-data.ts` 文案与版本号。
