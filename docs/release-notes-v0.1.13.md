# Aurora TV v0.1.13

手机返回键 / 返回手势逐级返回修复。

## 修复

- Android 系统返回键现在先交给网页处理：
  - 播放器 → 关闭播放器，回到详情；
  - 详情 → 关闭详情，回到首页/分类；
  - 搜索 / 设置 / 片库 → 关闭面板；
  - 分类页 → 返回首页；
  - 已经在首页 → 直接退出 App，不再需要按两次。
- 边缘内划返回和系统返回键共用同一套 `closeTop()` 逻辑，不会各自关一层或需要按两次。
- 修复播放器 `navLock` 导致返回键无法关闭播放器的问题。
- Android 13+ / 全面屏手势的「返回」也会走这套逻辑。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.13_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.13_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.13_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.13_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.13_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.13_x64_en-US.msi` |

签名与 0.1.12 一致，可直接覆盖安装。
