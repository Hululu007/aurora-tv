# Aurora TV v0.1.1

手机端适配版本。桌面与 Android TV 的版式保持不变。

## 手机端改了什么

- **底部四栏导航**：首页 / 搜索 / 片库 / 设置，拇指可达；进入详情、面板或播放器时自动收起
- **安全区适配**：顶栏、底部导航、设置面板、播放器控件都处理刘海与手势条
- **Hero 重排**：顶部悬浮海报 + 页码点，标题与简介下沉；矮屏自动隐藏海报
- **详情页**：4 列选集、粘性返回按钮 + 顶部渐变遮罩，滚动不丢返回
- **搜索**：3 列结果、隐藏电视屏幕键盘、热门词；输入框 16px 防 iOS 缩放
- **设置 / 片源**：纵向表单、全宽分段控件、隐藏冗余的「片源管理」入口
- **播放器**：竖屏提示横屏、横屏控件重排、按钮适配手指点击
- **触屏体验**：不再出现遥控器焦点环，卡片点击不再被 hover 抢焦点，面板打开时锁定背景滚动

## 包含文件

| 平台 | 文件 | 说明 |
| --- | --- | --- |
| Windows | `AuroraTV_0.1.1_x64-setup.exe` | NSIS 安装包 |
| Windows | `AuroraTV_0.1.1_x64_en-US.msi` | MSI 安装包 |
| Android / TV 64 位 | `AuroraTV_0.1.1_arm64-v8a.apk` | 手机与现代电视盒子 |
| Android / TV 32 位 | `AuroraTV_0.1.1_armeabi-v7a.apk` | 老款电视盒子 |

APK 使用项目 release keystore 签名，可直接覆盖安装 v0.1.0（签名一致）。

## 安装

**Windows**：运行 `setup.exe`。

**Android / TV**：

```bash
adb install -r AuroraTV_0.1.1_arm64-v8a.apk
```

电视端已声明 Leanback 入口、横屏与 320×180 banner。

## 已知限制

- **type 3 spider 站点（jar / drpy）仍不支持**，当前使用 type 1 CMS 站点；已支持 `parses` 解析线路。
- 播放器暂不支持直播（`lives`）与弹幕。
- 手机横屏的桌面式首页尚未单独排版（播放器已适配横屏）。

完整说明见 [README](https://github.com/othellllo/aurora-tv/blob/main/README.md)。
