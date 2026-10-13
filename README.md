# 每日奖励关卡规划器（Reward Quest Planner）

一个以「奖励关卡」为核心的日程与自律工具：把每日待办事项作为**前置条件**，完成全部条件后解锁当日的**奖励**。完成条件和获得奖励都能累计积分，并通过日历、徽章、积分明细等视图反馈进度。

## ✨ 功能特性

- **奖励关卡**：每个关卡包含一个或多个前置条件（如「阅读 30 分钟」），完成全部条件后解锁奖励。
- **积分系统**：完成条件、获得奖励均累计积分（规则见下方）。
- **奖励池（跨日积累）**：当天未完成的关卡会顺延到次日的奖励池，奖励不丢失。
- **徽章成就**：共 4 枚徽章，解锁每枚奖励 +20 积分。
- **日历视图**：以日历形式查看历史完成情况。
- **自由奖励券**：允许创建 0 条件关卡，但需要消耗自由奖励券兜底；无券且无条件时拒绝创建。
- **单日关卡**：关卡只在设定当天出现（不再每日重复），切日期按该日计划加载。

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite + React 19 + React Router 7 + Tailwind CSS 4 + Recharts + lucide-react + axios |
| 后端 | Node.js + Express 4 + SQLite（sqlite3） |
| 其他 | cors / morgan / dotenv / nanoid / date-fns |

## 📁 目录结构

```
.
├── client/                      # 前端（Vite + React）
│   └── src/
│       ├── api/                 # REST API 封装（quests / dailyPlans / points / rewardSessions / user）
│       ├── components/          # QuestCard、QuestDialog、Timer、CalendarHeatmap、LevelBadge 等
│       ├── context/             # 全局状态（QuestContext / UserContext）
│       ├── pages/               # TodayView、StatsView、PointsView、BadgesView、RewardTimer
│       ├── hooks/               # useTimer 等自定义 Hook
│       └── utils/               # calc / date / questTypes 工具
├── server/                      # 后端（Express + SQLite）
│   ├── routes/                  # user / quests / dailyPlans / rewardSessions / points
│   ├── db.js                    # 数据库连接与迁移
│   ├── server.js                # 服务入口
│   └── data.sqlite              # SQLite 数据库
└── package.json                 # 根脚本（可并行启动前后端）
```

## 🚀 快速开始

### 1. 安装依赖

在项目根目录执行（会自动安装根 / 前端 / 后端三处依赖）：

```bash
npm run install:all
```

或分别安装：

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. 启动

**一键并行启动前后端（推荐）：**

```bash
npm run dev
```

**分别手动启动：**

```bash
# 后端（http://localhost:3001）
cd server
npm run dev          # 或 node server.js

# 前端（http://localhost:5173）
cd client
npm run dev          # 或 npm run build && npm run preview
```

### 3. 打开页面

浏览器访问 <http://localhost:5173/>，标题显示「每日奖励关卡规划器」即成功。

## 🔌 端口

| 服务 | 地址 |
|---|---|
| 前端（Vite） | <http://localhost:5173> |
| 后端（Express） | <http://localhost:3001> |

> 后端端口可通过环境变量 `PORT` 覆盖，默认 `3001`。

## 📡 API 概览

所有业务接口前缀为 `/api`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET / POST | `/api/quests` | 查询 / 创建奖励关卡 |
| PUT / DELETE | `/api/quests/:id` | 更新 / 删除关卡（删除为软删除并清理当日及未来计划） |
| GET | `/api/daily-plans?date=YYYY-MM-DD` | 按日期查询当日计划 |
| GET / POST | `/api/reward-sessions` | 奖励计时会话 |
| GET | `/api/points` | 积分明细 |
| GET | `/api/user` | 用户信息（积分、徽章、自由奖励券等） |

## 🎯 积分规则

**完成前置条件**（按条件时长）：

| 时长 | 积分 |
|---|---|
| ≤ 30 分钟 | +5 |
| 30–60 分钟 | +10 |
| > 60 分钟 | +20 |

**获得奖励**（按奖励时长）：

| 时长 | 积分 |
|---|---|
| ≤ 30 分钟 | +10 |
| 30–60 分钟 | +5 |
| > 60 分钟 | +0 |

**徽章解锁**：统一 +20 积分（共 4 枚徽章）。

## 🗄️ 数据库

- 文件：`server/data.sqlite`
- 主要表：`user`、`quests`（含 `quest_date` 单日字段）、`conditions`、`daily_plans`、`completions`、`reward_sessions`、`badges`、`levels`
- 种子数据：`badges` 4 条、`levels` 6 条
- 备份：`server/data.sqlite.bak-20261013`

## 📄 需求文档

产品需求文档（PRD）：`C:\Users\PC\Desktop\Hyrox\Per\奖励关卡PRD.docx`
