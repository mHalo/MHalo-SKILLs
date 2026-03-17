
# 云空间素材素材API文档

https://open.feishu.cn/document/server-docs/docs/drive-v1/media/introduction


# 云空间多维表格API文档

https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview


# 云空间考勤打卡API文档

https://open.feishu.cn/document/server-docs/attendance-v1/overview


# 素材管理权限配置

要使用素材管理功能（上传/下载），需要在飞书开放平台为应用开通以下权限：

## 必需权限

1. **云空间**
   - `drive:media:upload` - 上传素材
   - `drive:media:download` - 下载素材
   - `drive:drive:readonly` 或 `drive:drive` - 访问云空间

2. **云文档（根据使用场景）**
   - `docs:document` 或 `docs:document:readonly` - 访问文档
   - `sheets:spreadsheet` 或 `sheets:spreadsheet:readonly` - 访问表格
   - `bitable:app` 或 `bitable:app:readonly` - 访问多维表格

## 开通权限步骤

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 选择你的应用
3. 进入「权限管理」页面
4. 搜索并添加以上权限
5. 点击「批量开通」
6. **重要**：发布应用版本，让权限生效

## 常见错误

### 403 Forbidden (code: 1061004)

**原因**：
- 应用未开通云空间/云文档相关权限
- 应用未被授权访问目标资源（如多维表格）

**解决方案**：
1. 检查并开通上述必需权限
2. 确保应用已被添加到多维表格的协作者中
3. 如果是测试，可以使用「测试企业和人员」功能进行测试

### 400 Bad Request (code: 99991672)

**原因**：
- parent_type 和 parent_node 不匹配
- parent_node 不存在或无权限访问

**解决方案**：
- 确认 parent_node 对应的 token 正确
- 确认应用有权限访问该资源


# CLI 命令参考

## 今日考勤报告 (cli/today-attendance.ts)

```bash
# 获取今日考勤概况
npx ts-node cli/today-attendance.ts

# 只看迟到人员
npx ts-node cli/today-attendance.ts --late-only

# 保存到文件
npx ts-node cli/today-attendance.ts -o ./today-attendance.json

# 指定考勤组
npx ts-node cli/today-attendance.ts -g <group_id>
```

## 素材管理器 (cli/media-manager.ts)

```bash
# 上传素材
npx ts-node cli/media-manager.ts upload \
  -f /path/to/file.png \
  -t docx_image \
  -n <doc_token>

# 下载素材
npx ts-node cli/media-manager.ts download \
  -t <file_token> \
  -o /path/to/save.png

# 获取临时下载链接
npx ts-node cli/media-manager.ts url \
  --tokens <token1>,<token2>
```

## 通讯录查询 (cli/contact-query.ts)

```bash
# 查询单个用户
npx ts-node cli/contact-query.ts -i <user_id>

# 批量查询
npx ts-node cli/contact-query.ts --ids <id1>,<id2>
```

## 支持的素材父类型

| 类型 | 说明 |
|------|------|
| `doc_image` | 旧版文档图片 |
| `docx_image` | 新版文档图片 |
| `sheet_image` | 表格图片 |
| `bitable_image` | 多维表格图片 |
| `doc_file` | 旧版文档文件 |
| `docx_file` | 新版文档文件 |
| `sheet_file` | 表格文件 |
| `bitable_file` | 多维表格文件 |
| `whiteboard` | 白板 |
| `vc_virtual_background` | 视频会议虚拟背景 |


# 扩展 SKILL 指南

如需生成代码文件以增强本 SKILL，请遵循以下规范：

## 1. 存放位置

所有生成的代码文件必须放在 `generate-scripts/` 文件夹中。

## 2. CLI 规范

生成的代码需要符合 CLI 调用方式，即可以直接通过 `npx ts-node generate-scripts/xxx.ts` 执行。

## 3. 业务场景

CLI 脚本应当针对具体的业务场景，而不是简单的功能封装。例如：
- ✅ 导出月度考勤报表
- ✅ 批量上传员工头像
- ✅ 发送考勤提醒通知
- ❌ 简单的获取用户信息
- ❌ 简单的上传文件

## 4. 代码风格

- 使用 TypeScript
- 包含完整的类型定义
- 添加 JSDoc 注释
- 使用统一的参数解析方式

## 5. 示例模板

```typescript
#!/usr/bin/env ts-node
/**
 * [功能描述]
 * 
 * 业务场景：[具体场景描述]
 * 
 * 用法：
 *   npx ts-node generate-scripts/my-script.ts [选项]
 */

import { [需要的函数] } from '../scripts/[模块]';

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      const key = arg.replace('-', '');
      const value = args[i + 1];
      if (value && !value.startsWith('-')) {
        result[key] = value;
        i++;
      }
    }
  }
  return result;
}

function printUsage() {
  console.log(`
[标题]

用法: npx ts-node generate-scripts/my-script.ts [选项]

选项:
  -h, --help          显示帮助信息

示例:
  npx ts-node generate-scripts/my-script.ts
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);

  try {
    // 业务逻辑
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
```
