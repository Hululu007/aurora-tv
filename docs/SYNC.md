# 三端播放记录同步

手机、Windows、Android TV 共用一份「继续观看」记录。同步的是 **HistoryEntry**：
片名、线路、集数、播放位置、时长、更新时间（以及拉起播放所需的线路）。

**不同步**片源配置、外观设置和账号，避免一台设备的改动覆盖另一台。

## 三种方式

| 方式 | 适合 | 需要 | 数据存在哪 |
| --- | --- | --- | --- |
| 局域网（HTTP） | 家里三端连同一个 Wi-Fi | 一台常开的电脑跑 `npm run sync` | 电脑的 `.sync-data/` |
| WebDAV | 想随时随地同步 | 坚果云 / Nextcloud 等 | 你的网盘目录 |
| GitHub Gist | 有 GitHub 账号 | Token（gist 权限） | 私密 Gist |

三种方式在 App 里的入口相同：**设置 → 播放记录自动同步**。
三端必须填写同一套配置（同一个服务器 / 同一个 WebDAV 文件 / 同一个 Gist）。

## 方式一：局域网同步

适合家里手机 + 电视 + 电脑。电脑不用装 Rust/Android，只要有 Node.js。

1. 在电脑上启动同步服务：

```bash
npm run sync
# [aurora] sync server: http://0.0.0.0:8788
```

2. 查看电脑局域网 IP：

```bash
ipconfig
# 例如 192.168.1.10
```

3. 三端都打开：设置 → 播放记录自动同步 → 同步方式选「局域网」，
   服务器地址填 `http://192.168.1.10:8788`，密钥留空。

4. 点「立即同步」。手机/电视第一次可能需要允许局域网访问；Windows 防火墙要放行 8788。

数据文件：`.sync-data/default.json`，可以用 `DATA_DIR` 改目录。

需要一点保护时：

```bash
SYNC_TOKEN=my-secret npm run sync
```

三端在「同步密钥」里填 `my-secret`。

> 电脑关机或离开家后，局域网方式不可用；需要远程同步选 WebDAV 或 Gist。

## 方式二：WebDAV

推荐坚果云（免费额度够放几十 KB 的记录文件）。

1. 坚果云网页版 → 账户信息 → 安全选项 → **添加应用密码**（不要用登录密码）。
2. 在网盘根目录建一个文件夹，例如 `AuroraTV`。
3. App 里选择「WebDAV」：
   - 地址：`https://dav.jianguoyun.com/dav/AuroraTV/`
   - 用户名：坚果云登录邮箱
   - 应用密码：上一步生成的密码
4. 点「立即同步」，会自动写入 `aurora-tv-history.json`。

Nextcloud 的地址形如：

```
https://your-host/remote.php/dav/files/username/AuroraTV/
```

注意：

- 目录必须已存在，文件会自动创建；
- 浏览器预览受 CORS 限制，WebDAV 请用 Windows / Android 客户端；
- 密码保存在本机 localStorage，建议使用应用密码而不是主密码。

## 方式三：GitHub Gist

1. GitHub → Settings → Developer settings → Personal access tokens → 创建 Token，勾选 **gist**。
2. App 里选择「Gist」，粘贴 Token，Gist ID 留空。
3. 点「立即同步」：会创建一个 **私密 Gist**（描述 `Aurora TV 播放记录`），并把 ID 回填。
4. 其他两端粘贴同一个 Token + 自动回填的 Gist ID 即可。

注意 GitHub API 在部分网络下需要代理；如果连不上，改用 WebDAV。

## 自动同步是怎么触发的

- 播放器每 5 秒写一次本地进度；停止写入 **4 秒后**自动上传；
- 应用启动后 2.5 秒自动拉取一次；
- 从后台切回（visibilitychange / focus）拉取，60 秒节流；
- 设置里点「立即同步」随时手动执行；
- 关闭「自动同步」后只能手动。

同步过程始终是 **先拉取 → 合并 → 再上传**，不会用空数据覆盖远端。

## 冲突规则

以 `mediaKey`（站点 + 影片 ID）为一条记录：

1. `updatedAt` 更新的记录胜出；
2. 时间相同，播放位置更靠后的胜出；
3. **删除也会同步**：在「历史」页删除或清空时，记录会写入 `deletedAt` 墓碑（`updatedAt` 同步更新），其他端拉到后标记为已删除并隐藏；
4. 删除后如果重新播放同一部片，新记录 `updatedAt` 更新，会覆盖墓碑并恢复；
5. 只补字段不丢字段：新记录缺少海报/线路时沿用旧记录；
6. 最多保留最近 60 条（墓碑也占位，旧墓碑会被新记录挤出）。

因此两台设备同时看同一部片，最后停下的那台会赢；不同影片互不影响。

## 安全

- 同步凭证只存在本机 `localStorage`，不会写进「手动同步码」；
- 局域网同步默认无鉴权，建议设置 `SYNC_TOKEN`，并且只在家庭网络开放 8788；
- WebDAV 使用 HTTPS 与应用密码；
- Gist Token 只勾选 `gist`，不要给 repo 权限；
- 同步文件里只有片名、集数、进度，没有账号密码。

## 服务端接口（自建）

`server/sync.mjs` 只有两个接口：

```http
GET /history?key=default
PUT /history?key=default
Authorization: Bearer <SYNC_TOKEN>   # 可选
Content-Type: application/json

{"app":"aurora-tv-sync","version":1,"updatedAt":...,"deviceId":"...","history":[...]}
```

首次 `GET` 返回 404 是正常的（还没有记录），App 会当作空记录处理。

## 常见问题

**Q：点同步提示 404？**
第一次还没有文件，属于正常；再点一次或播放几秒后就有了。

**Q：手机连不上电脑？**
确认在同一 Wi-Fi、电脑防火墙放行 8788、地址是电脑局域网 IP（不是 127.0.0.1）。

**Q：WebDAV 401？**
坚果云必须用「应用密码」，不是登录密码；用户名是邮箱。

**Q：同步后另一台没变化？**
另一台要打开自动同步，或在设置里点「立即同步」；切回 App 会自动拉取。

**Q：会不会把我看过的记录删掉？**
不会自动删。只有在「历史」页手动删除/清空时才会删，并且会同步到其他端；重新播放同一部片会恢复出新记录。
