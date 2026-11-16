# Aurora TV v0.1.3

三端播放记录同步。

## 新增

- **播放记录自动同步**：手机 / Windows / Android TV 共用「继续观看」
  - **局域网**：电脑跑 `npm run sync`，三端填 `http://电脑IP:8788`，无需账号；
  - **WebDAV**：坚果云 / Nextcloud，一个目录 + 应用密码；
  - **GitHub Gist**：Token 勾选 gist，首次自动创建私密 Gist。
- 自动策略：进度变化 4 秒后上传；启动 / 切回应用自动拉取；可手动「立即同步」
- 冲突合并：同一影片按 `updatedAt` 取最新，时间相同取进度更靠后；只增不减，最多 60 条
- 只同步观看进度，不同步片源、外观和账号；同步凭证只保存在本机
- 手动同步码保持不变，且不会带出 WebDAV / Gist / 局域网密码
- Tauri 新增 `http_request` 命令，原生支持 PUT/PATCH 与自定义 header（WebDAV / Gist 需要）

## 包含文件

| 平台 | 文件 |
| --- | --- |
| Windows | `AuroraTV_0.1.3_x64-setup.exe` / `.msi` |
| Android / TV 64 位 | `AuroraTV_0.1.3_arm64-v8a.apk` |
| Android / TV 32 位 | `AuroraTV_0.1.3_armeabi-v7a.apk` |

签名与之前版本一致，可直接覆盖安装。

## 怎么用

1. 三端升级到 0.1.3；
2. 设置 → 播放记录自动同步 → 选一种方式，填同一套配置；
3. 点「立即同步」，之后会自动同步。

局域网示例：

```bash
npm run sync
# 手机 / 电视 / Windows 都填 http://电脑局域网IP:8788
```

坚果云、Gist、鉴权与冲突规则的完整说明见
[docs/SYNC.md](https://github.com/othellllo/aurora-tv/blob/main/docs/SYNC.md)。

## 已知限制

- 局域网方式要求运行同步服务的电脑在线；离开家请用 WebDAV / Gist。
- 浏览器预览访问 WebDAV 会受 CORS 限制，客户端（Windows / Android）不受影响。
- **type 3 spider 站点（jar / drpy）仍不支持**，当前使用 type 1 CMS 站点；已支持 `parses` 解析线路。
- 播放器暂不支持直播（`lives`）与弹幕。
