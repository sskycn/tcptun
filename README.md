# tcptun.com

tcptun-go 的 Next.js 静态站点，通过 GitHub Pages 发布到 [tcptun.com](https://tcptun.com/)。

## 本地开发

```bash
pnpm install
pnpm dev
```

本地构建使用已提交的 `app/tcptun-release.json` 发布清单：

```bash
pnpm build
```

需要在本地更新发布清单时，先解压目标 npm 包，再执行
`node scripts/sync-tcptun-release.mjs <package-root> <tcptun-binary> <version>`。GitHub Actions 会自动完成这一步。

## 自动同步 tcptun 版本

`.github/workflows/pages.yml` 每小时查询 npm registry 的 `tcptun@latest`，并与线上的
`https://tcptun.com/tcptun-version.json` 比较：

- 版本变更时，下载该 npm 发布包，调用其 Linux CLI 生成所有协议的标准配置。
- `scripts/sync-tcptun-release.mjs` 从 CLI help、协议文档和实际生成的 JSON 生成 `app/tcptun-release.json`。
- 页面的版本、协议、transport、security 选项和配置模板都使用这份发布清单重新构建。
- 版本未变更时，跳过安装、构建和部署。
- `main` 分支提交和手动触发始终会使用 npm 最新版重新部署。

部署产物会生成 `tcptun-version.json`，其中记录版本、协议、transport 和 security，并作为下次定时检查的版本标记。
