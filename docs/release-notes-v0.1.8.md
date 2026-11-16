# Aurora TV v0.1.8

电视 / Windows 播放器改成全屏 + 铺满，遥控器可操作全部控制项。

## 播放器

- **手机端**：保留「横屏 / 竖屏」切换；
- **电视 / Windows 端**：不再显示横屏，改为：
  - **全屏 / 退出全屏**：Windows 上把窗口切到全屏；
  - **铺满 / 适应**：铺满会裁掉上下或左右黑边（`object-fit: cover`），真正占满屏幕；
- 音量 / 静音、倍速、清晰度、返回在两种布局下都保留；
- 电视遥控 ↑ / ↓ 在所有控制项之间移动焦点，回车执行；焦点按钮白色高亮；
- 分类排序、内置片源、三端同步等保持不变。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.8_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.8_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.8_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.8_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.8_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.8_x64_en-US.msi` |

签名与 0.1.7 一致，可直接覆盖安装。

## 已验证

- Windows 1440px：控制条显示「全屏 / 铺满」，点铺满后 `object-fit=cover`，点全屏进入 `fullscreenElement`；
- 手机 UA 390px：控制条显示「横屏」，不显示全屏/铺满；
- 电视端：遥控 ↑ 可依次选中播放、进度、下一集、静音、倍速、清晰度、全屏、铺满、退出，回车执行。
