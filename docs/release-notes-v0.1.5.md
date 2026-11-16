# Aurora TV v0.1.5

内置 5 个常用 CMS 片源，配置源全挂也能直接播。

## 新增

- **内置片源**（无需 tvbox-multi 配置）：
  - 电影天堂 `caiji.dyttzyapi.com`
  - 非凡资源 `api.ffzyapi.com`
  - 光速资源 `api.guangsuapi.com`
  - 量子资源 `cj.lziapi.com`
  - 素博资源 `subocaiji.com`
- 启动时优先使用内置可用站点；配置源仍会加载，在「片库」里可随时切换；
- 聚合源里与内置站点相同接口的条目自动去重；
- 修复部分 CMS 站点「分类为空、只有最新更新有内容」时首页行数过少的问题：
  现在会多取一页并按类型拆分，首页可显示 5 行 × 20 部；
- 内置站点优先选择直链 `m3u8` 线路（如电影天堂的 `dyttm3u8`），分享页线路保留备用。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.5_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.5_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.5_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.5_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.5_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.5_x64_en-US.msi` |

签名与 0.1.4 一致，可直接覆盖安装。

## 播放记录同步

保持 v0.1.3 的能力：局域网 / WebDAV / Gist 三端同步，详见
[docs/SYNC.md](https://github.com/othellllo/aurora-tv/blob/main/docs/SYNC.md)。

## 已知限制

- 内置站点是第三方 CMS 接口，可能随时失效；失效时在「片库」切换到其他站点即可。
- 少数站点只返回分享页地址，必须走解析或网页播放；App 会优先用 m3u8 线路。
- type 3 spider 站点（jar / drpy）仍不支持。
