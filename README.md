# tcptun.com

tcptun-go 的 Next.js 静态网站，通过 GitHub Pages 发布到 [tcptun.com](https://tcptun.com/)。

网站内容根据本机 `../tcptun-go` 仓库的 `v0.1.8` 源码、README、`FileConfig` 和 examples 手写实现；npm 仅用于安装入口、发布包和平台二进制下载地址，不参与生成网站。

## 本地开发

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
```

## 发布

推送到 `main` 或手动运行 GitHub Pages workflow 会构建并部署网站。没有定时 npm 检查或内容生成任务。

新版本发布后，需要根据 tcptun-go 源码人工更新 `app/site-data.ts` 与页面内容，并在提交前核对 npm 二进制直链。
