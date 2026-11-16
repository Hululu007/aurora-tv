# 鸿蒙 / HarmonyOS 支持说明

先看你的系统版本，两条路完全不同。

| 系统 | 能否装 Android APK | 怎么用 Aurora TV |
| --- | --- | --- |
| HarmonyOS 4.x / 4.2（含兼容 Android 的版本） | ✅ 可以 | 安装**手机端 APK** |
| HarmonyOS NEXT 5.x（纯血鸿蒙） | ❌ 不再支持 APK | 目前用网页 / PWA，见下文 |

## HarmonyOS 4.x：直接装手机端 APK

下载 Release 里的：

```
AuroraTV_0.1.5_phone-arm64-v8a.apk
```

设置 → 安全 → 更多安全设置 → 允许安装未知来源应用，然后安装即可。
手机端 APK 不锁横屏、不带 Leanback，和平常安卓手机一样使用。

## HarmonyOS NEXT：网页 / PWA

HarmonyOS NEXT 只接受 HAP（.hap），不认 APK。当前仓库**没有随 Release 提供 HAP**，
可以用网页版把手机当客户端：

1. 在电脑上构建并共享：

```bash
npm run build
npm run share
```

终端会打印：

```
http://192.168.1.10:4173     ← 手机浏览器打开
http://192.168.1.10:8787     ← App 里的本地代理
```

2. 手机和电脑连同一个 Wi-Fi，用华为浏览器打开 `http://192.168.1.10:4173`。
3. 进入 App：设置 → 片源 → 本地代理，填 `http://192.168.1.10:8787`，保存并刷新。
4. 浏览器菜单 →「添加到桌面」，以后可以像 App 一样打开。

Windows 防火墙需要放行 4173 和 8787；`npm run share` 会同时启动代理与预览服务。

### 这个方案的边界

- 电脑必须开机并运行 `npm run share`，不是独立 App；
- 局域网是 HTTP，浏览器不注册 Service Worker（离线缓存不可用），「添加到桌面」只是快捷方式；
- 部分 HLS 源站不允许跨域时无法播放（电脑端 / 安卓端不受影响）；
- 不能后台播放、没有系统级遥控器按键。

如果需要真正的鸿蒙原生 App，见下一节。

## 为什么没有直接给 HAP

HAP 必须用 **DevEco Studio + HarmonyOS SDK** 编译，并且安装包要用**华为签名证书 / Profile**签名；
这两样都需要在你的华为开发者账号下完成，当前构建环境没有 DevEco，也没有你的签名材料，
所以无法生成可安装的 HAP。

可行的原生方案是做一个 **ArkWeb 容器**：

- ArkTS `Web` 组件加载打包进 `rawfile` 的本项目 Web 构建；
- 通过 `javaScriptProxy` / `onInterceptRequest` 把 CMS 请求、图片、HLS 分片交给鸿蒙原生 `http` 模块，
  绕开 CORS；
- 用 `AVPlayer` 或 Web 的 MSE 播放。

这个容器需要在 DevEco 里编译、真机调试、用你的证书签名。如果你有 DevEco 环境，
可以按这个方向继续；没有的话，上面的网页方案是当前可用的路径。
