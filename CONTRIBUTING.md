# 贡献指南

感谢你考虑为 DBDesign 贡献代码！

## 报告 Bug

1. 先搜索已有 [Issues](https://github.com/SerenadoY/dbdesign/issues) 是否已记录
2. 新开 Issue 时请包含：
   - 环境（浏览器版本、Node 版本）
   - 复现步骤
   - 期望行为与实际行为
   - 截图（如适用）

## 提交 Pull Request

1. Fork 本仓库，从 `main` 创建新分支
2. 分支命名建议：`feat/xxx`、`fix/xxx`、`docs/xxx`
3. 本地验证通过后再提交

```bash
# 安装依赖
cd client && npm install
cd ../server && npm install

# 启动开发环境
npm run dev          # 前端 5173 + 后端 3001

# 代码检查
cd client && npm run lint
```

## 代码规范

- **前端**：React 18 + Vite 6 + Semi UI
- **后端**：Express + Socket.IO + sql.js
- **缩进**：2 空格（见 `.prettierrc.json`）
- **引号**：双引号（Prettier 自动格式化）
- **分号**：需要
- **尾逗号**：需要
- **命名**：camelCase（JS）、PascalCase（组件）
- **注释**：不要添加不必要的注释

## Commit 规范

使用 Conventional Commits 格式：

```
feat: 新功能
fix: 修复 Bug
docs: 文档变更
refactor: 重构
chore: 构建/工具变更
style: 代码格式（不影响逻辑）
```

示例：`feat: add real-time cursor awareness`

## 项目结构

```
client/          # 前端 (React)
  src/
    api/          # API 客户端
    components/   # UI 组件
    context/      # React Context
    hooks/        # 自定义 Hook
    pages/        # 页面
server/          # 后端 (Express)
  src/
    collab/       # Socket.IO 协同引擎
    db/           # SQLite 初始化
    middleware/   # JWT 认证
    models/       # 数据模型
    routes/       # API 路由
docs/            # 设计文档与截图
```

## 数据库

服务器使用 **sql.js**（纯 JS SQLite），无需安装额外数据库。每次写操作后需调用 `saveDbToDisk()` 持久化。

## License

AGPL v3。详情见 [LICENSE](LICENSE)。
