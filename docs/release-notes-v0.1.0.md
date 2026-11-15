# Aurora TV v0.1.0

苹果 TV 风格的跨端 TVBox 客户端首个可运行版本。

## 本次发布内容

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `AuroraTV_0.1.0_x64-setup.exe` | NSIS 安装包，双击安装 |
| Windows | `AuroraTV_0.1.0_x64_en-US.msi` | MSI 安装包，适合批量部署 |
| Android / Android TV | `AuroraTV_0.1.0_android-universal-debug.apk` | 通用 debug APK，可直接安装 |

## 功能

- Apple TV 风格界面：Hero 精选、海报行、详情、播放器、搜索、设置
- 读取 `tvbox-multi.json` 多源配置，自动探测可用的 CMS 站点，跳过全 spider 的源
- HLS / MP4 播放、进度续播、自动下一集、10 秒快进快退
- **parses 解析线路**：网页播放地址自动解析成 m3u8 直链
- 遥控器 / 键盘 / 手柄空间导航，选中卡片放大浮起
- 20+ 项外观与布局自定义，本地持久化
- 三端同步码：设置 + 片源 + 观看进度
- Windows / Android 原生请求，不受 CORS 限制

## 安装

**Windows**：下载 `setup.exe` 安装；首次启动如提示 WebView2，按提示安装即可（Win10/11 一般自带）。

**Android 手机 / 电视**：

```bash
adb install -r AuroraTV_0.1.0_android-universal-debug.apk
```

或把 APK 拷到 U 盘，用电视文件管理器安装（需允许未知来源）。
电视端已声明 Leanback 入口与横屏，会出现在电视的「应用」行。

## 已知限制

- **type 3 spider 站点（jar / drpy）暂不支持**，需要独立内核；当前自动使用 type 1 CMS 站点。
- APK 为 debug 签名，适合自用与测试；正式分发请配置自己的 keystore。
- 播放器暂不支持直播（`lives`）与弹幕。

完整说明见 [README](https://github.com/othellllo/aurora-tv/blob/main/README.md)。
