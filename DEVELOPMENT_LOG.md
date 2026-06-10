# 数字大脑 (Digital Brain) — 开发日志

## 项目概述

将飞书多维表格"数字大脑"改造为独立的 Web 应用。涵盖收件箱、任务板、工具箱、方法库、文献库、文件管理、日程、数据中心、AI 引擎、全局搜索 10 个模块，支持飞书双写同步与混合 AI 代理。

---

## 时间线

### 2026-06-09 — Phase 0-2：单体应用完整构建

**09:00 — 项目脚手架**
- Next.js 14 App Router + Prisma 5.22 + SQLite
- Tailwind CSS 3.4 + shadcn/ui（基于 @base-ui/react）
- 14 个数据库表：InboxItem, Task, Tool, Method, Document, FileAsset, CalendarEvent, Metric, AiMechanism, SearchIndex, AuditLog, Settings, FeishuSync, FeishuMessage

**10:30 — 基础设施**
- 布局组件：SidebarNav + HeaderBar + 暗色模式切换
- 6 个共享组件：DataTable, FilterPanel, DetailSheet, EmptyState, StatusBadge, SyncIndicator
- 17 个 UI 组件：Button, Input, Textarea, Dialog, DropdownMenu, Card, Badge, Calendar 等

**12:00 — 收件箱 + 自动化工作流**
- 手动录入 / 飞书消息自动导入
- 标签筛选 + 一键入库（6 目标分发：任务/工具/方法/文献/日程/AI引擎）
- 入库自动创建 SearchIndex + AuditLog

**14:00 — 5 个 CRUD 模块**
- 任务板（三列看板，待办→进行中→已完成）
- 工具箱（卡片网格 + 分类徽标）
- 方法库（Markdown 编辑 + 标签筛选）
- 文献库（文献标题/作者/摘要）
- 文件管理（上传 + 删除）

**16:00 — 仪表盘 + 全局搜索**
- Dashboard：待处理计数 + 快捷入口
- Search：关键词搜索，Suspense 异步加载

**18:00 — 飞书同步 + AI 引擎 + 分析 + 设置**
- AI Engine：提示词/工作流/Agent/Skill 四类机制
- Settings：飞书 Key + DeepSeek Key 管理
- Analytics：指标分类统计

**22:00 — 修复收尾**
- Tailwind shadcn 颜色 token 配置修正
- ESLint 未使用变量清理
- TypeScript 类型检查通过，生产构建通过

---

### 2026-06-09 — Phase 3：前后端分离

**17:00 — Backend (Hono)**
- Hono 4 + @hono/node-server
- 14 个路由模块，从 Next.js API Routes 完整迁移
- CORS 配置（localhost:5173）
- Prisma + SQLite 数据库复制
- 端口 :3001

**17:30 — Frontend (Vite + React)**
- Vite 5 + React 18 + TypeScript
- react-router-dom v6 替换 Next.js 路由
- TanStack Query 持久化
- 自定义 useTheme Hook 替换 next-themes
- 12 个页面全部移植完成

**修复的问题：**
| 问题 | 解决 |
|------|------|
| date-fns v4 与 react-day-picker v8 冲突 | 升级到 react-day-picker v10 |
| @base-ui/react 未安装 | 添加到 dependencies |
| DialogTrigger 嵌套 Button DOM 错误 | DialogTrigger 直接传入 className |
| Button 未 forwardRef | 改为 React.forwardRef |
| Tasks 空状态 early return 导致 Dialog 未挂载 | 改为条件渲染 |
| Settings 链接 href → to | react-router-dom Link 使用 to |
| 缺失 vite-env.d.ts | 添加 Vite 类型声明 |

**验证结果：**
- TypeScript: 0 errors
- Vite build: 5.5s，3022 modules
- 12 页面全部加载正常
- CRUD 操作正常
- 暗色模式正常

---

### 2026-06-09 — 清理

- 删除根目录原 Next.js 单体项目文件
- 统合 backend/.env 配置（DATABASE_URL + PORT + FEISHU_APP_ID + FEISHU_APP_SECRET + DEEPSEEK_API_KEY）

---

## 最终结构

```
digital-brain/
├── backend/
│   ├── .env                  # 数据库 + 飞书 + AI 配置
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/               # Schema + 迁移 + dev.db
│   └── src/
│       ├── index.ts          # Hono 入口，CORS + 14 路由挂载
│       ├── lib/prisma.ts     # Prisma 客户端
│       ├── lib/feishu.ts     # 飞书 Token + API 封装
│       └── routes/           # 14 个路由模块
│           ├── inbox.ts      # CRUD + POST /:id/route（6 目标入库）
│           ├── tasks.ts      # CRUD + 状态迁移
│           ├── tools.ts      # CRUD
│           ├── methods.ts    # CRUD
│           ├── library.ts    # CRUD
│           ├── files.ts      # CRUD
│           ├── calendar.ts   # CRUD
│           ├── metrics.ts    # CRUD
│           ├── ai-engine.ts  # CRUD
│           ├── ai.ts         # DeepSeek 代理
│           ├── search.ts     # GET /?q=
│           ├── settings.ts   # GET/PUT key-value
│           ├── sync.ts       # 飞书双写触发
│           └── webhook.ts    # 飞书 Bot 回调
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx          # React 入口
│       ├── App.tsx           # 路由 + 布局
│       ├── types/api.ts      # 10 个共享接口
│       ├── config/api.ts     # API_BASE_URL
│       ├── hooks/useTheme.ts # 暗色模式 Hook
│       ├── pages/            # 12 个页面
│       ├── components/       # 24 个组件
│       │   ├── ui/           # 17 个 UI 组件（shadcn/ui）
│       │   ├── shared/       # 6 个共享组件
│       │   ├── layout/       # SidebarNav + HeaderBar
│       │   ├── providers/    # ThemeProvider + QueryProvider
│       │   └── inbox/        # RouteButton
│       └── lib/utils.ts      # cn() 工具函数
└── .gitignore
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Hono 4 (Node.js) |
| ORM | Prisma 5.22 |
| 数据库 | SQLite |
| 前端框架 | Vite 5 + React 18 |
| 路由 | react-router-dom v6 |
| 状态管理 | TanStack Query 5 |
| UI | Tailwind CSS 3.4 + shadcn/ui (@base-ui/react) |
| AI | DeepSeek API (chat/completions) |
| 外部集成 | 飞书开放平台 (SDK 预留) |

## 待办

- [ ] 飞书多维表格 API 替换 Prisma CRUD
- [ ] 真实文件存储（本地/OSS）
- [ ] 用户认证
- [ ] Docker 部署
- [ ] 全文检索（SQLite FTS5）
