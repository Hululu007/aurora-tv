#!/usr/bin/env node
/**
 * 给 tauri android init 生成的 Gradle 工程补上 release 签名配置。
 *
 * 需要的环境变量（CI 中来自 GitHub Secrets）：
 *   ANDROID_KEYSTORE_BASE64
 *   ANDROID_KEYSTORE_PASSWORD
 *   ANDROID_KEY_ALIAS
 *   ANDROID_KEY_PASSWORD
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const androidRoot = path.join(root, 'src-tauri', 'gen', 'android')
const gradlePath = path.join(androidRoot, 'app', 'build.gradle.kts')
const keystorePath = path.join(androidRoot, 'app', 'aurora-release.jks')
const propsPath = path.join(androidRoot, 'keystore.properties')

const b64 = process.env.ANDROID_KEYSTORE_BASE64
const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD
const keyAlias = process.env.ANDROID_KEY_ALIAS
const keyPassword = process.env.ANDROID_KEY_PASSWORD

if (!b64 || !storePassword || !keyAlias || !keyPassword) {
  console.error('[patch-android-signing] 缺少签名相关的环境变量')
  process.exit(1)
}

if (!fs.existsSync(gradlePath)) {
  console.error(`[patch-android-signing] 找不到 ${gradlePath}`)
  process.exit(1)
}

// 1) 写入 keystore 与 properties
fs.writeFileSync(keystorePath, Buffer.from(b64, 'base64'))
fs.writeFileSync(
  propsPath,
  [
    'storeFile=app/aurora-release.jks',
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    '',
  ].join('\n'),
)

// 2) 注入 signingConfigs
let gradle = fs.readFileSync(gradlePath, 'utf8')

if (!gradle.includes('signingConfigs {')) {
  const signingBlock = `    signingConfigs {
        create("release") {
            val keystoreProperties = Properties()
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(keystorePropertiesFile.inputStream())
                storeFile = rootProject.file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
            }
            // 老电视 / Android 5-6 只认 v1（JAR）签名
            enableV1Signing = true
            enableV2Signing = true
        }
    }

    buildTypes {`

  if (!gradle.includes('    buildTypes {')) {
    console.error('[patch-android-signing] build.gradle.kts 结构不符合预期（缺少 buildTypes）')
    process.exit(1)
  }
  gradle = gradle.replace('    buildTypes {', signingBlock)
}

// 3) release 使用该签名
if (!gradle.includes('signingConfig = signingConfigs.getByName("release")')) {
  const before = gradle
  gradle = gradle.replace(
    /getByName\("release"\) \{\n/,
    'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")\n',
  )
  if (before === gradle) {
    console.error('[patch-android-signing] 没找到 release buildType')
    process.exit(1)
  }
}

fs.writeFileSync(gradlePath, gradle)
console.log('[patch-android-signing] release 签名配置已写入')
