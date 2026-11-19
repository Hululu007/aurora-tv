# Aurora TV v0.1.11

照顾老电视：降低最低系统版本，补 v1 签名。

## 安装兼容性

- `minSdkVersion` 从 24 降到 **23**：支持 Android 6.0 / 7.0 的老电视和盒子；
- APK 同时启用 **v1（JAR）签名 + v2 签名**：
  - Android 6.0 只认 v1，之前只有 v2 会提示「应用未安装 / 解析包错误」；
  - Android 7+ 继续用 v2。
- 电视端仍分 `arm64-v8a` 和 `armeabi-v7a`：
  - 老盒子绝大多数是 32 位，请装 `AuroraTV_0.1.11_tv-armeabi-v7a.apk`；
  - 如果装 `arm64` 报「应用未安装」，换 32 位包。

## 老电视注意

- 最低 Android 6.0（API 23）；**Android 5.1 及以下不支持**，Tauri 依赖的 AndroidX 组件最低要求 API 23；
- 极老的电视 WebView 可能太旧导致白屏；可以在电视上安装/更新「Android System WebView」或 Chrome 后再试；
- 电视端仍带 Leanback 入口、横屏、banner，遥控器可操作播放器全部控制项。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.11_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.11_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.11_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.11_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.11_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.11_x64_en-US.msi` |

签名与 0.1.10 一致，可直接覆盖安装。
