# Aurora TV v0.1.4

按端拆分的安装包 + 三端播放记录同步。

## 该下哪个文件

| 端 | 文件 | 说明 |
| --- | --- | --- |
| **手机端（64 位）** | `AuroraTV_0.1.4_phone-arm64-v8a.apk` | 绝大多数安卓手机 |
| **手机端（32 位）** | `AuroraTV_0.1.4_phone-armeabi-v7a.apk` | 老款 32 位手机 |
| **电视端（64 位）** | `AuroraTV_0.1.4_tv-arm64-v8a.apk` | 现代电视 / 电视盒子 |
| **电视端（32 位）** | `AuroraTV_0.1.4_tv-armeabi-v7a.apk` | 老款电视盒子 |
| **Windows 端** | `AuroraTV_0.1.4_x64-setup.exe` | 安装版，双击安装 |
| **Windows 端** | `AuroraTV_0.1.4_x64_en-US.msi` | MSI 部署包 |

手机版和电视版是两个独立 APK：

- 手机版：**不锁横屏**，竖屏/旋转跟随系统；不注册 Leanback，从手机桌面启动；
- 电视版：**横屏、Leanback 入口、320×180 banner**，出现在电视的「应用」行，遥控器操作；
- 包名和签名相同（`com.auroratv.app`），同一台设备装一个即可，互相覆盖安装不会丢数据。

## 播放记录同步（v0.1.3 起）

手机 / 电视 / Windows 共用「继续观看」，设置 → 播放记录自动同步：

- **局域网**：电脑跑 `npm run sync`，三端填 `http://电脑IP:8788`（最快）；
- **WebDAV**：坚果云 / Nextcloud 目录 + 应用密码；
- **Gist**：GitHub Token（gist 权限）。

进度变化 4 秒后上传，启动 / 切回应用自动拉取；只同步进度，不同步片源与账号。
详见 [docs/SYNC.md](https://github.com/othellllo/aurora-tv/blob/main/docs/SYNC.md)。

## 安装

**手机 / 电视**：

```bash
adb install -r AuroraTV_0.1.4_phone-arm64-v8a.apk
# 或
adb install -r AuroraTV_0.1.4_tv-arm64-v8a.apk
```

电视也可以把 APK 拷到 U 盘，用电视文件管理器安装（需允许未知来源）。

**Windows**：运行 `setup.exe`；Win10/11 一般自带 WebView2。

## 其他

- 签名与 v0.1.3 一致，可直接覆盖升级；
- 手机版首次启动是竖屏；电视版固定横屏；
- type 3 spider 站点仍需内核，当前使用 type 1 CMS 站点；
- 播放器暂不支持直播与弹幕。
