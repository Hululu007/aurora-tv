# Aurora TV v0.1.12

继续修手机竖屏：布局宽度和方向锁双保险。

## 修复

- 手机 WebView 有时会把布局宽度报成 980px，导致竖屏下也套用桌面/横屏排版；
  - 移动端 CSS 现在会在 **竖屏 + 触摸设备** 时强制生效，不再只依赖 `width <= 720px`；
  - `isPhoneUi()` 同步按「手机 UA + 触摸 + 竖屏」判断，底部导航、手势、焦点逻辑保持一致；
- 设置页新增「屏幕」一行，显示实际 `宽×高`、DPR 和方向，方便确认是不是 WebView 宽度问题；
- Android `targetSdk` 固定到 34：Android 16 对 `targetSdk >= 36` 的大屏设备会忽略竖屏锁定，
  降到 34 可以避免手机/折叠屏被系统强制横屏；
- 修复 `index.html` 里 `description` 的乱码。

## 说明

- 手机 APK 的 `screenOrientation` 仍是 `portrait`；
- 如果设置页「屏幕」显示 `980×...` 且方向是「竖屏」，说明是 WebView 宽度问题，这一版已经按竖屏手机强制移动布局；
- 如果显示实际手机宽度（如 `390×844`）但方向是「横屏」，那是系统方向锁/ROM 问题，需要允许自动旋转或关闭强制横屏。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.12_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.12_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.12_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.12_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.12_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.12_x64_en-US.msi` |
