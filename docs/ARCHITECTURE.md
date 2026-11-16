# 架构说明

## 总览

```
┌──────────────────────────────────────────────────────────────┐
│                      React UI（同一套代码）                    │
│  Home / Detail / Player / Search / Settings / Sources        │
│  styles.css 设计系统 · nav.ts 空间焦点 · useCatalog 数据编排     │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
      ┌─────────▼─────────┐          ┌─────────▼─────────┐
      │  浏览器（开发/PWA） │          │  Tauri 2 壳        │
      │  fetch → 本地代理   │          │  invoke fetch_text │
      └─────────┬─────────┘          └─────────┬─────────┘
                │                              │
                └──────────────┬───────────────┘
                               ▼
                 TVBox 配置 / 苹果 CMS 接口 / m3u8
```

前端不关心自己跑在浏览器还是 WebView：

- `src/core/net.ts` 里 `getText()` 先判断 `window.__TAURI_INTERNALS__`；
- 有原生壳 → `invoke('fetch_text', { url, referer })`，Rust 用 `reqwest` 发请求，天然无 CORS；
- 没有 → 走 `http://127.0.0.1:8787/proxy?url=…`，失败再尝试直连并给出中文错误提示；
- 图片同理：浏览器模式统一走 `/img?url=`（附带 UA / Referer 绕过防盗链），Tauri 直接用原地址。

## 数据模型

`src/core/types.ts`：

| 类型 | 用途 |
| --- | --- |
| `RawConfig` / `RawSite` | TVBox 源配置与站点，保留原始字段 |
| `Site` | 归一化后的可播放站点（仅 `type === 1` 且 `api` 是 http(s)） |
| `Vod` / `VodClass` | CMS 接口原始返回 |
| `CatalogItem` | UI 统一影片模型（演示数据与真实数据共用） |
| `PlayGroup` / `Episode` | 线路与选集 |
| `PlaybackState` | 播放器入参（片名、线路、集数、起始进度） |
| `HistoryEntry` | 续播记录，同时是同步码的一部分 |

`CatalogItem` 的设计原则：**演示数据与真实数据同构**。demo 项自带 `palette`（渐变海报）和 `groups`（内置测试流），真实项带 `api` + `siteKey`，详情页按需再拉线路。

## 启动流程

`useCatalog.boot()`：

1. `loadMulti(configUrl)` 读取 `urls` 列表，缓存 3 小时；
2. 计算源探测顺序：上次成功的源 → 设置里选的源 → 其余；最多 4 个；
3. 逐个 `loadSourceConfig`（容忍 `//` 注释、尾逗号），`toSites()` 只保留 CMS 站点；
4. 汇总所有候选站点，`rankSites()` 排序：上次成功的站点 → 已知稳定域名 → https → 可搜索；
5. `activateFirstWorking()` 最多探测 8 个站点，每个 9 秒超时：
   `ac=list` 取分类 → 取前 5 个分类各拉一页 → 若不足 2 行，补一页「最新更新」；
6. 第一个有内容的站点胜出，写入 `localStorage.aurora.lastSource/lastSite`；
7. 全部失败 → 内置演示片库 + 可读错误（设置与片源面板里可见）。

缓存键：`aurora.cache.multi:<url>`、`aurora.cache.source:<url>`，TTL 3 小时，设置里可手动清除。

## TVBox 兼容层

`src/core/tvbox.ts` 只实现「直连型」协议：

```
列表   GET {api}?ac=videolist&t={type_id}&pg={page}
分类   GET {api}?ac=list
详情   GET {api}?ac=videolist&ids={vod_id}
搜索   GET {api}?ac=videolist&wd={keyword}
```

- `joinApi()` 会先剥掉原有的 `ac=` 参数，避免 `?ac=list&ac=videolist` 这种拼接错误；
- `parsePlayGroups()` 按 TVBox 约定拆 `$$$`（线路）、`#`（集）、`$`（名称/地址）；
- 线路按「直链 m3u8 占比」排序，优先能直接播的；
- 过滤掉 `magnet:`、`push://`、网页解析地址，并给出明确提示。

### 补齐 spider（type 3）的扩展点

建议在 Tauri 侧新增一个命令：

```rust
#[tauri::command]
async fn spider_request(site: String, action: String, payload: String) -> Result<String, String>
```

Rust 内嵌 QuickJS（`rquickjs`）加载 `drpy2.min.js` 或 jar 对应的 JS 运行时，实现 TVBox 的
`homeContent / categoryContent / detailContent / searchContent / playerContent` 五个方法，返回同样的
`Vod` JSON。前端只需把 `loadGroups()`/`buildRows()` 的分支从「HTTP CMS」切到「spider 调用」，UI 与数据模型不变。

## 内置片源

`src/core/builtin.ts` 固定了 5 个 CMS 站点（电影天堂 / 非凡 / 光速 / 量子 / 素博）。
`useCatalog.boot()` 会把它们和配置源合并，并给 `sourceIndex = -1` 的站点更高优先级；
聚合源里接口相同的条目会被 `withBuiltinSites()` 去重。配置完全加载失败时仍然会先探测内置站点，
全部失败才进入演示片库。

## 解析线路（parses）

CMS 站点经常返回「网页播放地址」而不是直链。`resolveParseUrl()`（`src/core/tvbox.ts`）会：

1. 判断是否已是 `.m3u8` / `.mp4`，是则直接播放；
2. 否则按 `type === 1`（JSON 解析）优先、`type === 0`（网页解析）其次，最多尝试 5 条；
3. 请求 `parse.url + encodeURIComponent(播放地址)`，从返回的 JSON/HTML 里提取第一个 `m3u8` / `mp4` 直链；
4. 全部失败则原样返回，由播放器展示可重试的错误。

解析在播放器里**按集懒加载**，不会因为一季几十集而一次性发几十个请求；解析期间显示「正在解析播放地址」。
它解决的是「CMS 站点 + 网页播放页」，**不能**替代 spider：spider 站点连列表与详情都来自 class/js 逻辑，必须要有内核。

## 焦点导航

`src/core/nav.ts` 是一个不依赖框架的空间导航实现：

- 可聚焦元素打 `data-nav`；当前项加 `.is-focused`（同时 `focus()` 以便原生回车/无障碍）；
- 方向键触发 `moveFocus(dir)`：对每个候选计算主轴距离、副轴中心距、投影重叠，取最小分；
- 允许 `data-autofocus="1"` 指定首选；
- 焦点移动时用 `scrollIntoView({ block:'nearest', inline:'center' })` + 手动安全边距滚动，保证电视上选中项不被顶栏遮挡；
- 手柄：`startGamepadLoop()` 轮询 `navigator.getGamepads()`，左摇杆/十字键移动，A 确认，B 返回；
- 图层：详情/设置/搜索各自 `setNavRoot(panelRef)`，关闭时置空，避免焦点落到遮罩后面。

## 播放

`src/views/Player.tsx`：

- 原生 HLS（Safari / iOS）直接 `video.src`；其他环境用 `hls.js`（MSE）；
- 错误分层提示：网络错误 / 编码错误 / 未知错误，可重试（重建 HLS 实例，不刷新页面）；
- 进度每 5 秒写一次 `HistoryEntry`，关闭时强制写一次；
- 播完按设置自动下一集（跨线路时切到下一组第 1 集）。

## 与「三端互通」相关的存储

| Key | 内容 |
| --- | --- |
| `aurora.settings.v1` | 全部设置（含同步配置与凭证） |
| `aurora.history.v1` | 最近 60 条观看记录（含线路与进度） |
| `aurora.lastSource` / `aurora.lastSite` | 上次成功的源与站点，加速启动 |
| `aurora.cache.*` | 配置/源 JSON 缓存，3 小时 |

同步码 = Base64(JSON{ settings(不含 sync), history, exportedAt })，见 `encodeSync/decodeSync`。

## 播放记录同步

`src/core/sync.ts` 只同步 `HistoryEntry[]`，不碰片源与外观：

```
本地 history ──┐
               ├─ mergeHistory(updatedAt 新者胜) ── saveHistory ── push(SyncDoc)
远端 SyncDoc ──┘
```

- **HTTP / 局域网**：`server/sync.mjs`，`GET/PUT /history?key=...`，可选 `SYNC_TOKEN`；
- **WebDAV**：`PUT {dir}/aurora-tv-history.json`，Basic Auth；浏览器受 CORS 限制；
- **Gist**：`GET/PATCH/POST https://api.github.com/gists`，Token 需 gist 权限。

Tauri 端新增 `http_request` 命令（method / headers / body），浏览器端直接 `fetch`。
触发时机：进度写入后 4 秒防抖、启动 2.5 秒、切回前台 60 秒节流；合并永远先拉后推。
