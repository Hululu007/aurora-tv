# Aurora TV v0.1.10

修复手机版启动横屏。

## 修复

- 手机端 APK 在 `AndroidManifest.xml` 里显式设置
  `android:screenOrientation="portrait"`，启动固定竖屏；
- 部分 ROM / 车机模式 / 系统自动旋转会把未指定方向的 Activity 直接按横屏启动，
  这一版不再依赖系统判断；
- 电视端仍然是 `landscape`，Windows 端不受影响。

## 说明

- 手机进入播放器后点「横屏」仍然可以全屏横屏；如果系统不允许方向锁定，会退化为画面旋转；
- 如果你装的是 `tv` 版 APK（文件名带 `tv-`），它本来就是横屏，请换 `phone-` 开头的文件。

## 包含文件

| 端 | 文件 |
| --- | --- |
| 手机端 64 位 | `AuroraTV_0.1.10_phone-arm64-v8a.apk` |
| 手机端 32 位 | `AuroraTV_0.1.10_phone-armeabi-v7a.apk` |
| 电视端 64 位 | `AuroraTV_0.1.10_tv-arm64-v8a.apk` |
| 电视端 32 位 | `AuroraTV_0.1.10_tv-armeabi-v7a.apk` |
| Windows 安装版 | `AuroraTV_0.1.10_x64-setup.exe` |
| Windows MSI | `AuroraTV_0.1.10_x64_en-US.msi` |

签名与 0.1.9 一致，可直接覆盖安装。
