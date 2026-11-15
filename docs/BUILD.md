# 构建与打包

## 0. 通用准备

```bash
npm install
npm run build      # 产出 dist/
```

> **最快的方式：让 GitHub 帮你编译。**
> 仓库内的 `.github/workflows/build.yml` 会在 `windows-latest` 和 `ubuntu-latest` 上分别产出
> Windows 安装包与 Android APK，无需本机安装 Rust / VS / Android SDK。
> 打开 Actions → Build → 最近一次运行 → Artifacts 下载；推 `v*` 标签会自动发 Release。

`npm run build` 会先跑 `tsc -b` 做类型检查，再用 Vite + terser 打包。
Vite 配置用 `--configLoader runner` 加载，规避少数 Windows 安全软件锁 esbuild 临时文件的问题。

## 1. 浏览器 / PWA

```bash
npm run proxy     # 终端 1，127.0.0.1:8787
npm run dev       # 终端 2，127.0.0.1:5173
```

生产静态部署：把 `dist/` 丢给任意静态服务器即可（Nginx / Vercel / Cloudflare Pages）。
但浏览器端接口需要代理，且 HLS 分片要求源站允许跨域，因此**只建议用于预览**；正式使用请打包原生客户端。

## 2. Windows

### 依赖

1. [Rust](https://rustup.rs/)（stable，MSVC toolchain）
2. Visual Studio 2022 Build Tools，勾选「使用 C++ 的桌面开发」
3. WebView2 Runtime（Win10/11 通常自带）

### 开发 / 打包

```bash
npm run tauri:dev
npm run tauri:build
```

产物：

- `src-tauri/target/release/bundle/msi/*.msi`
- `src-tauri/target/release/bundle/nsis/*-setup.exe`

首次编译会下载并编译 Tauri / reqwest 依赖，约 5–15 分钟。

## 3. Android 手机

### 依赖

1. Rust + Android targets：

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

2. Android Studio：SDK Platform 34+、Build-Tools、NDK（r26+）、Platform-Tools
3. 环境变量：`ANDROID_HOME`、`NDK_HOME`（或让 Android Studio 自动配置）

### 初始化与运行

```bash
npx tauri android init
npx tauri android dev          # 连接手机/模拟器
npx tauri android build --apk  # 生成 APK
```

APK 位置：`src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

签名：默认使用 debug 签名；发布前在 `src-tauri/gen/android/app/build.gradle.kts` 配置 `signingConfigs`，并保管好 keystore。

## 4. Android TV 适配

`tauri android init` 生成的清单在：

```
src-tauri/gen/android/app/src/main/AndroidManifest.xml
```

### 4.1 声明电视与遥控器

在 `<manifest>` 内、`<application>` 外加入：

```xml
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
```

### 4.2 横屏 + Leanback 启动入口

找到 `MainActivity`，改成：

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:screenOrientation="landscape"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
    android:theme="@style/Theme.aurora_tv">

    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
        <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
    </intent-filter>
</activity>
```

`LEANBACK_LAUNCHER` 让应用出现在电视的「应用」行。

### 4.3 电视 Banner（可选但推荐）

Android TV 需要 320×180 的 banner：
把 `docs/screenshots/banner.png`（可自行用 `public/icons/icon-1024.png` 裁切）放到
`src-tauri/gen/android/app/src/main/res/drawable/banner.png`，并在 `<application>` 上加：

```xml
android:banner="@drawable/banner"
```

### 4.4 遥控器按键

WebView 会把方向键/OK/返回映射成标准键盘事件，`src/core/nav.ts` 已经处理：
`ArrowUp/Down/Left/Right`、`Enter`、`Escape`。
如果某些电视盒子的返回键不触发 `Escape`，在 `MainActivity` 里覆写 `onBackPressed` 并 `webView.evaluateJavascript("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))")`。

### 4.5 安装到电视

```bash
adb connect <电视IP>:5555
adb install -r app-universal-release.apk
```

或把 APK 拷到 U 盘，用电视的文件管理器安装（需允许「未知来源」）。

## 5. 常见问题

### `Access is denied`（esbuild 临时文件）

少数安全软件（360、火绒等）会锁定 esbuild 写出的临时文件，表现为：

```
[vite:esbuild-transpile] remove ... Access is denied.
```

本项目已把压缩器换成 terser。若仍出现：

- 把项目目录加入安全软件白名单；
- 或临时关闭「文档保护 / 受控文件夹访问」；
- 或设置 `TEMP`/`TMP` 到非受保护目录后再构建。

### `failed to load config ... Cannot read directory "../../.."`

同样是 esbuild 读目录被拦截。脚本已统一使用 `--configLoader runner`；
若手动执行 `vite`，请带上该参数。

### Android 构建找不到 NDK

确认 `ANDROID_HOME` 与 `NDK_HOME` 指向实际目录，并在 Android Studio 的 SDK Manager 里安装
「NDK (Side by side)」与「CMake」。

### Windows 上 `npm run proxy` 端口被占用

```bash
set PORT=8788 && npm run proxy
```

然后在「设置 → 片源 → 本地代理」里改成 `http://127.0.0.1:8788`。
