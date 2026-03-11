# 示例参考文档

此文档放在 references/ 目录下，包含详细的参考信息。

## 何时加载此文档

当需要以下信息时，加载此文档到上下文：
- 详细的API规范
- 数据库schema
- 复杂的工作流程

## 内容示例

### 数据库表结构

```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);
```

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/users | GET | 获取用户列表 |
| /api/users | POST | 创建新用户 |

## 注意事项

- 此文件按需加载，不会一直占用上下文
- 如果文件很大（>10k字），在SKILL.md中提供搜索模式
