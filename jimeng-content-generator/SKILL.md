---
name: jimeng-content-generator
description: 基于火山引擎即梦AI的文生图/文生视频能力，支持多版本模型（v3.0/v3.1/v4.0/3.5 Pro），提供图片生成、视频生成（含音画同步）功能。图片自动保存到 OpenClaw media 目录供展示。
---

# 即梦AI 文生图/文生视频 Skill

基于火山引擎即梦AI的文生图和文生视频能力，支持通过文本描述生成图片和视频内容。

**⚠️ 必须先配置 OpenClaw**，否则脚本会报错退出！

## 功能概述

本 Skill 支持以下生成能力：

| 功能类型 | 支持模式 | 特点 |
|---------|---------|------|
| **文生图** | 文本 → 图片 | v3.0/v3.1/v4.0 多版本，支持多种尺寸 |
| **文生视频 3.0** | 文本 → 视频 | 1080P 高清，无声视频 |
| **图生视频 3.0** | 图片+文本 → 视频 | 首帧驱动动画，无声视频 |
| **首尾帧视频 3.0** | 首图+尾图+文本 → 视频 | 平滑过渡，无声视频 |
| **文生视频 3.5 Pro** | 文本 → 视频 | Seedance 1.5 pro，**带音频** |
| **图生视频 3.5 Pro** | 图片+文本 → 视频 | 首帧驱动，**带音频** |
| **首尾帧视频 3.5 Pro** | 首图+尾图+文本 → 视频 | 平滑过渡，**带音频** |

## 支持模型对比

### 文生图模型

| 模型版本 | 脚本 | 特点 | 推荐场景 |
|---------|------|------|---------|
| **v4.0** | `text2image.ts` | 最新版本，画质最佳 | 高质量图片生成（推荐） |
| **v3.1** | `text2image.ts` | 改进版本，平衡质量与速度 | 通用场景 |
| **v3.0** | `text2image.ts` | 基础版本，生成速度快 | 快速预览 |

### 视频生成模型

| 模型 | 脚本 | 分辨率 | 时长 | 音频 | 特点 | 所需凭证 |
|------|------|--------|------|------|------|---------|
| **Seedance 1.5 Pro** | `text2video-v35.ts` | 最高 1080P | 5s/10s/12s | ✅ **支持** | 音画同步，口型匹配 | 方舟 API Key |
| **Jimeng 3.0** | `text2video.ts` | 720P/1080P | 5s/10s | ❌ 无声 | 高清视频，首尾帧 | CV 服务 AK/SK |

## 环境配置

### 1. 必需配置

创建 `.env` 文件：

```bash
# OpenClaw Media 路径 - 生成的内容将保存到该目录
OPENCLAW_MEDIA_PATH=C:\Users\Username\AppData\Roaming\OpenClaw\media  # Windows
# OPENCLAW_MEDIA_PATH=/Users/username/.config/OpenClaw/media           # Mac/Linux
```

### 2. 根据功能选择凭证

#### 方案 A：文生图 + 视频 3.0（CV 服务）

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `VOLCENGINE_AK` | ✅ | 火山引擎 Access Key |
| `VOLCENGINE_SK` | 条件 | 永久凭证必需；临时凭证(AKTP开头)可不填 |
| `VOLCENGINE_TOKEN` | 可选 | 临时凭证 STS 必需 |

**获取方式**：
1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入「访问控制」→「密钥管理」
3. 创建或查看访问密钥

#### 方案 B：视频 3.5 Pro（方舟平台）

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `VOLCENGINE_API_KEY` 或 `ARK_API_KEY` | ✅ | 方舟平台 API Key |

**获取与开通步骤**：
1. 登录 [方舟控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apikey)
2. 创建 API Key
3. **开通模型**：进入 [模型广场](https://console.volcengine.com/ark/region:ark+cn-beijing/model) 搜索 "Seedance"
4. 开通 `doubao-seedance-1-5-pro-251215` 模型
5. 等待 2-3 分钟生效

> 💡 **建议**：如果需要使用全部功能，同时配置两种凭证。

## 安装依赖

```bash
cd ~/.openclaw/workspace/skills/jimeng-content-generator

# 优先使用 pnpm
pnpm install

# 或 npm
npm install
```

## 快速开始

### 文生图（最常用）

```bash
# 基础用法
npx ts-node scripts/text2image.ts "一只可爱的橘猫在阳光下打盹"

# 高质量生成（推荐）
npx ts-node scripts/text2image.ts "山水风景画，水墨风格" --version v40 --ratio 16:9

# 批量生成
npx ts-node scripts/text2image.ts "未来科幻城市" --version v40 --count 4
```

### 文生视频 3.0（无声高清）

```bash
# 文生视频
npx ts-node scripts/text2video.ts "元宵节灯笼在夜空中飘动" --ratio 9:16 --duration 5

# 图生视频
npx ts-node scripts/text2video.ts "让猫咪动起来" --first-frame ./cat.jpg --duration 5

# 首尾帧视频
npx ts-node scripts/text2video.ts "猫咪变身老虎" \
  --first-frame ./cat.jpg \
  --last-frame ./tiger.jpg \
  --duration 5
```

### 文生视频 3.5 Pro（带音频）⭐ 推荐

```bash
# 文生视频（带环境音效）
npx ts-node scripts/text2video-v35.ts "一只小猫在弹钢琴，优美的旋律" --wait

# 图生视频（带音频）
npx ts-node scripts/text2video-v35.ts "这只猫咪慢慢眨眼" --first-frame ./cat.jpg --wait

# 指定时长和比例
npx ts-node scripts/text2video-v35.ts "海浪拍打沙滩" --duration 10s --ratio 16:9 --wait
```

## 详细使用指南

### 一、文生图（text2image.ts）

#### 基础用法

```bash
npx ts-node scripts/text2image.ts "提示词" [选项]
```

#### 完整参数

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| `prompt` | 图片生成提示词（位置参数，必填） | - | - |
| `--version` | 模型版本 | `v30`, `v31`, `v40` | `v31` |
| `--ratio` | 宽高比 | `1:1`, `9:16`, `16:9`, `3:4`, `4:3`, `2:3`, `3:2`, `1:2`, `2:1` | `16:9` |
| `--count` | 生成数量 | `1` - `4` | `1` |
| `--width` | 指定宽度（像素） | - | - |
| `--height` | 指定高度（像素） | - | - |
| `--size` | 指定面积（如 4194304 = 2048²） | - | - |
| `--seed` | 随机种子（可复现结果） | - | - |
| `--output` | 输出目录 | - | `./output` |
| `--debug` | 调试模式 | - | `false` |
| `--no-download` | 只返回URL，不下载 | - | `false` |

#### 示例

```bash
# 生成风景画
npx ts-node scripts/text2image.ts "山水风景画，水墨风格" --version v40 --ratio 16:9

# 生成科幻城市（多张）
npx ts-node scripts/text2image.ts "未来科幻城市，霓虹灯光，赛博朋克风格" --version v40 --ratio 16:9 --count 2

# 指定尺寸
npx ts-node scripts/text2image.ts "抽象艺术" --width 2048 --height 1152
```

---

### 二、视频生成 3.0（text2video.ts）

无声高清视频，支持文生视频、图生视频、首尾帧视频三种模式。

#### 三种生成模式

| 模式 | 所需输入 | 说明 |
|------|---------|------|
| **文生视频** | 提示词 | 纯文本生成视频 |
| **图生视频** | 提示词 + 首帧图片 | 以图片为起始帧生成动画 |
| **首尾帧视频** | 提示词 + 首帧图片 + 尾帧图片 | 生成从首帧到尾帧的过渡动画 |

#### 完整参数

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| `prompt` | 视频生成提示词（位置参数，必填） | - | - |
| `--ratio` | 宽高比 | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `21:9` | `9:16` |
| `--duration` | 视频时长（秒） | `5`, `10` | `5` |
| `--fps` | 帧率 | `24`, `30` | `24` |
| `--first-frame` | 首帧图片（本地路径或URL） | - | - |
| `--last-frame` | 尾帧图片（本地路径或URL） | - | - |
| `--resolution` | 分辨率 | `720p`, `1080p` | `1080p` |
| `--output` | 输出目录 | - | `./output` |
| `--wait` | 等待任务完成 | - | `false` |
| `--debug` | 调试模式 | - | `false` |
| `--no-download` | 不下载视频 | - | `false` |

#### 示例

**模式 1：文生视频**
```bash
npx ts-node scripts/text2video.ts "一只可爱的猫咪在草地上奔跑" --ratio 9:16 --duration 5
```

**模式 2：图生视频（首帧）**
```bash
# 使用本地图片（自动转 Base64）
npx ts-node scripts/text2video.ts "猫咪在草地上奔跑" \
  --first-frame ./images/cat.jpg \
  --duration 5

# 使用图片 URL
npx ts-node scripts/text2video.ts "猫咪在草地上奔跑" \
  --first-frame "https://example.com/cat.jpg" \
  --duration 5
```

**模式 3：首尾帧视频**
```bash
# 本地文件混合使用
npx ts-node scripts/text2video.ts "猫咪变身老虎" \
  --first-frame ./cat.jpg \
  --last-frame ./tiger.jpg \
  --duration 5 \
  --wait

# URL 和本地文件混合
npx ts-node scripts/text2video.ts "产品变形展示" \
  --first-frame "https://example.com/product1.jpg" \
  --last-frame ./product2.jpg \
  --ratio 9:16 \
  --duration 10 \
  --wait
```

> **提示**：
> - 首尾帧功能支持 720P 和 1080P 分辨率
> - 本地图片会自动转为 Base64 上传，无需手动上传
> - 使用 `--wait` 参数会等待任务完成并自动下载视频

---

### 三、视频生成 3.5 Pro（text2video-v35.ts）⭐ 推荐

**Seedance 1.5 Pro** 支持音画同步生成，视频会自动配上：
- 🎵 **环境音效** - 场景氛围音（海浪、风声、雨声等）
- 🗣️ **口型同步** - 人物说话自动对口型
- 🎹 **乐器演奏** - 自动匹配乐器声音
- 🔊 **动作音效** - 动作相关的声音效果

#### 特点对比

| 特性 | 3.0 | 3.5 Pro |
|------|-----|---------|
| 音频 | ❌ 无声 | ✅ **自动生成** |
| 口型同步 | ❌ 不支持 | ✅ **支持** |
| 最高画质 | 1080P | 1080P |
| 最大时长 | 10秒 | 12秒 |
| API 平台 | CV 服务 | 方舟平台 |

#### 完整参数

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| `prompt` | 视频生成提示词（位置参数，必填） | - | - |
| `--duration` | 视频时长 | `5s`, `10s`, `12s` | `5s` |
| `--ratio` | 宽高比 | `16:9`, `9:16`, `1:1` | `16:9` |
| `--first-frame` | 首帧图片路径（本地文件） | - | - |
| `--last-frame` | 尾帧图片路径（本地文件） | - | - |
| `--output` | 输出目录 | - | `./output` |
| `--wait` | 等待任务完成并下载 | - | `false` |
| `--debug` | 调试模式 | - | `false` |

#### 示例

**文生视频（带音频）**
```bash
# 基础用法
npx ts-node scripts/text2video-v35.ts "一只小猫在弹钢琴，优美的旋律"

# 等待完成并下载
npx ts-node scripts/text2video-v35.ts "海浪拍打沙滩，海鸥叫声" --duration 10s --wait

# 指定比例
npx ts-node scripts/text2video-v35.ts "竖屏短视频内容" --ratio 9:16 --duration 5s
```

**图生视频（带音频）**
```bash
# 让静态图片动起来，并配上环境音效
npx ts-node scripts/text2video-v35.ts "这只可爱的猫咪慢慢地眨着眼睛" \
  --first-frame ./cat.jpg \
  --duration 5s \
  --wait
```

**首尾帧视频（带音频）**
```bash
npx ts-node scripts/text2video-v35.ts "猫咪变身老虎，带变形音效" \
  --first-frame ./cat.jpg \
  --last-frame ./tiger.jpg \
  --duration 10s \
  --wait
```

> **前置要求**：
> 1. 设置 `VOLCENGINE_API_KEY` 或 `ARK_API_KEY`
> 2. 在方舟控制台开通 `doubao-seedance-1-5-pro-251215` 模型
> 3. 开通后等待 2-3 分钟生效

---

## 输出格式

### 文生图输出

#### 任务已提交
```json
{
  "success": true,
  "submitted": true,
  "prompt": "一只可爱的猫咪",
  "version": "v40",
  "ratio": "16:9",
  "count": 1,
  "taskId": "1234567890",
  "folder": "./output/image/<md5_hash>",
  "message": "任务已提交，请稍后使用相同提示词查询结果"
}
```

#### 任务已完成
```json
{
  "success": true,
  "prompt": "一只可爱的猫咪",
  "version": "v40",
  "ratio": "16:9",
  "count": 1,
  "taskId": "1234567890",
  "images": ["./output/image/<md5_hash>/1.jpg"],
  "outputDir": "./output/image/<md5_hash>"
}
```

### 视频生成输出

#### 任务已提交
```json
{
  "success": true,
  "submitted": true,
  "taskId": "cgt-xxxxx",
  "folder": "./output/video/<md5_hash>",
  "message": "任务已提交，请稍后查询"
}
```

#### 任务已完成（3.5 Pro 带音频）
```json
{
  "success": true,
  "taskId": "cgt-xxxxx",
  "videoUrl": "https://ark-content-generation.../video.mp4",
  "videoPath": "./output/video-v35/<md5_hash>/video.mp4",
  "withAudio": true,
  "message": "视频已生成（带音频）"
}
```

#### 任务已完成（3.0 无声）
```json
{
  "success": true,
  "taskId": "1234567890",
  "videoUrl": "https://.../video.mp4",
  "videoPath": "./output/video/<md5_hash>/video.mp4",
  "data": {}
}
```

---

## 文件夹结构

```
output/
├── image/                      # 文生图输出目录
│   └── <md5(prompt)>/          # MD5哈希作为文件夹名
│       ├── param.json          # 请求参数
│       ├── response.json       # API提交响应
│       ├── taskId.txt          # 任务ID
│       └── 1.jpg, 2.jpg...     # 生成的图片
│
├── video/                      # 视频 3.0 输出目录
│   └── <md5(prompt)>/
│       ├── param.json
│       ├── taskId.txt
│       └── video.mp4           # 生成的视频（无声）
│
└── video-v35/                  # 视频 3.5 Pro 输出目录
    └── <md5(prompt)>/
        ├── param.json
│       ├── taskId.txt
│       ├── result.json         # 任务结果详情
        └── video.mp4           # 生成的视频（带音频）
```

---

## 常见问题

### Q: 提示 "请设置环境变量 VOLCENGINE_AK 和 VOLCENGINE_SK"

**A**: 根据你要使用的功能配置对应凭证：
- 文生图/视频 3.0 → 配置 `VOLCENGINE_AK` + `VOLCENGINE_SK`
- 视频 3.5 Pro → 配置 `VOLCENGINE_API_KEY`

### Q: 视频 3.5 Pro 返回 404 错误

**A**: 模型未开通，请按以下步骤操作：
1. 登录 [方舟控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/model)
2. 搜索 "Seedance" 找到 `doubao-seedance-1-5-pro-251215`
3. 点击「开通」按钮
4. 等待 2-3 分钟后重试

### Q: 如何获取 OpenClaw Media 路径？

**A**: 在 OpenClaw 应用中查看设置，或尝试以下默认路径：
- Windows: `%APPDATA%\OpenClaw\media`
- macOS: `~/Library/Application Support/OpenClaw/media`
- Linux: `~/.config/OpenClaw/media`

### Q: 可以生成多长时间的视频？

**A**: 
- 视频 3.0: 5秒或10秒
- 视频 3.5 Pro: 5秒、10秒或12秒

### Q: 视频生成需要多长时间？

**A**: 通常需要 30-120 秒，取决于：
- 视频时长（5s/10s/12s）
- 当前队列长度
- 是否使用首尾帧（处理时间更长）

使用 `--wait` 参数会自动轮询直到完成。

---

## 参考文档

- [火山引擎即梦AI文生图文档](https://www.volcengine.com/docs/85621/1820192)
- [火山引擎即梦AI文生视频文档](https://www.volcengine.com/docs/85621/1792702)
- [方舟平台 Seedance 1.5 Pro 文档](https://www.volcengine.com/docs/82379/1366799)
- [方舟平台 API 参考](https://www.volcengine.com/docs/82379/1520757)
