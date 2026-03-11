---
name: gemini-image-generator
description: 使用 Gemini API 生成图片。支持自定义内容描述、图片比例、分辨率和思考等级。必须配置 OpenClaw media 目录，图片将直接保存到该目录供 OpenClaw 读取展示。
---

# Gemini 图片生成器

使用 `gemini-3.1-flash-image-preview` 模型生成图片，专为 OpenClaw 优化。适用于创意绘画、图像设计、场景模拟、内容创作等场景。

**⚠️ 必须先配置 OpenClaw**，否则脚本会报错退出！

## 快速开始

### 1. 配置 OpenClaw（必须）

```bash
cp .env.example .env
```

编辑 `.env`，添加 OpenClaw media 目录绝对路径：

```
# Windows
OPENCLAW_MEDIA_PATH=C:\Users\Username\AppData\Roaming\OpenClaw\media

# Mac/Linux
OPENCLAW_MEDIA_PATH=/Users/username/.config/OpenClaw/media
```

### 2. 生成图片

```bash
npx ts-node scripts/generate-image.ts --contents "一只穿着宇航服的猫"
```

**参数说明：**

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `--contents` | 是 | - | 图片内容描述/编辑提示词 |
| `--aspectRatio` | 否 | 4:3 | 比例，支持 16:9, 1:1, 3:2 等 |
| `--imageSize` | 否 | 512 | 分辨率，支持 512, 1K, 2K, 4K |
| `--thinkingLevel` | 否 | minimal | 思考等级，支持 minimal/high |
| `--editImage` | 否 | - | 图片编辑：输入图片路径（文本+图片生成新图片） |

### 文本生成图片

```bash
npx ts-node scripts/generate-image.ts --contents "一只穿着宇航服的猫"
```

### 图片编辑（文本+图片转图片）

使用 `--editImage` 参数指定输入图片，结合文本提示词进行图片编辑：

```bash
npx ts-node scripts/generate-image.ts \
  --contents "将这只猫变成赛博朋克风格，霓虹灯背景" \
  --editImage "path/to/your/image.jpg"
```

支持输入格式：JPG、PNG、GIF、WebP

完整示例：
```bash
npx ts-node scripts/generate-image.ts \
  --contents "日落时分的海边，金色阳光洒在海面上" \
  --aspectRatio 16:9 --imageSize 2K --thinkingLevel high
```

## 输出结构

图片直接保存到 OpenClaw media 目录：

```
<OpenClaw>/media/ddhd-nano-banana-images/
└── yyyy-MM-dd/
    ├── gemini-banana-{timestamp}.jpg    # 图片
    └── gemini-banana-{timestamp}.txt    # 参数记录
```

## OpenClaw 集成

### 文本生成图片

```typescript
const { stdout } = await execAsync(
  'node scripts/generate-image.js --contents "描述"'
);

const jsonLine = stdout.split('\n').find(l => l.trim().startsWith('{'));
const result = JSON.parse(jsonLine);

if (result.success) {
  // ⚠️ 必须直接发送图片，不要只回复路径！
  const imageBuffer = fs.readFileSync(result.paths.image);
  return { type: 'image', data: imageBuffer };
}
```

### 图片编辑（文本+图片转图片）

```typescript
const { stdout } = await execAsync(
  `node scripts/generate-image.js --contents "将这张图片变成油画风格" --editImage "${imagePath}"`
);

const jsonLine = stdout.split('\n').find(l => l.trim().startsWith('{'));
const result = JSON.parse(jsonLine);

if (result.success) {
  // result.mode 为 'imageEditing' 表示图片编辑模式
  const imageBuffer = fs.readFileSync(result.paths.image);
  return { type: 'image', data: imageBuffer };
}
```

### ⚠️ 关键提醒

**获取到图片路径后，必须直接发送图片给用户，不要只回复路径文字！**

- ❌ 错误："图片已生成，路径是：xxx"
- ✅ 正确：直接显示图片

### 使用 aiOutputMd 字段（推荐）

脚本返回的 JSON 中包含 `aiOutputMd` 字段，这是一个预先格式化好的 Markdown 文档，AI 可以直接使用：

```typescript
const { stdout } = await execAsync(
  'node scripts/generate-image.js --contents "一只可爱的猫"'
);

const jsonLine = stdout.split('\n').find(l => l.trim().startsWith('{'));
const result = JSON.parse(jsonLine);

if (result.success) {
  // ✅ 直接使用 aiOutputMd 字段，它包含了格式化的 Markdown 图片
  // AI 可以将这个内容作为参考，展示图片而不是输出路径
  console.log(result.aiOutputMd);
}
```

**aiOutputMd 输出示例：**

```markdown
## 图片生成结果

**状态**: ✅ 成功

**模式**: 文本生成图片

**生成时间**: 2026/3/5 09:30:45

**图片展示**:

![生成的图片](file:///C:/OpenClaw/media/ddhd-nano-banana-images/2026-03-05/gemini-banana-1741151245678.jpg)

**文件信息**:
- 路径: `C:\OpenClaw\media\ddhd-nano-banana-images\2026-03-05\gemini-banana-1741151245678.jpg`
- 大小: 45.23 KB
```

**返回结果结构：**

```json
{
  "success": true,
  "timestamp": 1741151234567,
  "mode": "textToImage",
  "aiOutputMd": "## 图片生成结果\n\n**状态**: ✅ 成功\n\n**模式**: 文本生成图片\n...",
  "paths": {
    "image": "path/to/image.jpg",
    "params": "path/to/params.txt"
  }
}
```

## 注意事项

- `--contents` 必填，描述越详细效果越好
- `--imageSize` K必须大写（512, 1K, 2K, 4K）
- 生成耗时约 10-60 秒，耐心等待
- OpenClaw 路径必须是**绝对路径**，且**可读写**
- 图片编辑模式（`--editImage`）支持 JPG、PNG、GIF、WebP 格式

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| 提示"OpenClaw 未配置" | 创建 `.env` 文件，配置 `OPENCLAW_MEDIA_PATH` |
| 提示"目录不存在" | 检查路径是否正确 |
| 提示"权限不足" | 确保 OpenClaw 对 media 目录有读写权限 |
| API 连接失败 | 检查网络，确认 `192.168.1.252:5789` 可访问 |
| 生成质量差 | 使用更详细的描述，或提高 `--thinkingLevel` 到 high |
| 图片编辑失败 | 检查 `--editImage` 路径是否正确，支持格式：JPG、PNG、GIF、WebP |

## API 配置

- **Base URL**: `http://192.168.1.252:5789/gemini/`
- **模型**: `gemini-3.1-flash-image-preview`
- **API Key**: 服务器已提供，无需配置
