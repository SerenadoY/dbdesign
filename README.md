<p align="center">
  <a href="README.md">🇨🇳 中文</a> · <a href="README.en.md">🇬🇧 English</a>
</p>

# DBDesign — 在线协同数据库设计工具

基于 [DrawDB](https://github.com/1ilit/drawdb) 改造，支持多人实时协作编辑 ER 图的 Web 应用。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite 6 + Semi UI + Tailwind CSS |
| 后端 | Express + Socket.IO + JWT |
| 数据库 | SQLite (sql.js, 内存 + 文件持久化) |
| 协同 | OT 合并引擎 + 实时感知 (cursor/awareness) |

## 启动

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install
cd ..

# 开发模式（前后端同时启动）
npm run dev          # 前端 :5173 + 后端 :3001
npm run dev:server   # 仅后端
npm run dev:client   # 仅前端

# 生产构建
npm run build && npm start   # 单端口 3001（服务端渲染前端）
```

## 项目结构

```
dbdesign/
├── client/          # 前端 (React)
│   └── src/
│       ├── api/          # API 客户端
│       ├── components/   # UI 组件
│       ├── context/      # React Context
│       ├── hooks/        # 自定义 Hook
│       └── pages/        # 页面 (Dashboard, Editor, 登录等)
├── server/          # 后端 (Express)
│   └── src/
│       ├── collab/       # Socket.IO 协同引擎
│       ├── db/           # SQLite 初始化 + 迁移
│       ├── middleware/   # JWT 认证中间件
│       ├── models/       # 数据模型
│       └── routes/       # API 路由
└── docs/            # 设计文档
```

## 功能

- **用户认证** — 注册 / 登录 / JWT 令牌
- **文稿管理** — 创建 / 编辑 / 删除数据库设计文稿
- **实时协同** — 多人同时编辑同一 ER 图
- **光标感知** — 画布上实时显示协作者光标位置
- **选中高亮** — 协作者选中表格时显示虚线边框
- **冲突提示** — 多人同时编辑同一对象时 Toast 警告
- **在线列表** — 工具栏显示当前在线协作者及正在编辑的表名

## 关键决策

- 使用 **sql.js** (纯 JS SQLite) 而非 `better-sqlite3`，无需原生编译
- 每次写操作后调用 `saveDbToDisk()` 持久化到 `server/data/dbdesign.db`
- 协同使用 **操作变换 (OT)** 合并 delta，不引入 CRDT
- Socket.IO 传输强制使用 `websocket`，绕过 Vite 代理的 long-polling 问题

## 开发进度

详见 [`开发进度.md`](开发进度.md)。

## License

AGPL v3. 基于 [DrawDB](https://github.com/1ilit/drawdb) (AGPL v3) 改造。

允许商用，但修改后的代码必须同样以 AGPL v3 开源；如果部署为网络服务，用户有权索取源码。
