# 每日奖励关卡规划器（Daily Playbook）

一个以「奖励关卡」为核心的日程与自律工具：把每日待办事项作为**前置条件**，完成全部条件后解锁当日的**奖励**。完成条件和获得奖励都能累计积分，并通过日历、徽章、积分明细等视图反馈进度。

**纯前端应用**：无后端、无数据库服务，全部数据存储在浏览器 localStorage 中，可作为静态站点直接部署。

## ✨ 功能特性

- **奖励关卡**：每个关卡包含一个或多个前置条件（如「阅读 30 分钟」），完成全部条件后解锁奖励。
- **仅当天可操作**：只有当天的条件可以勾选；查看历史/未来日期的卡片时，条件复选框与操作按钮自动禁用并显示提示。
- **完成确认弹卡**：勾选最后一个未完成条件时弹出确认（「真的完事了准备奖励自己吗」）——可立即开始奖励、稍后手动开始（再沉淀一会儿）、或撤销勾选（手滑了）。
- **奖励池（跨日顺延）**：当天未完成的关卡（条件未做完，或已解锁但未享受）自动顺延到次日奖励池，并完整保留前一天的勾选进度与解锁状态；已享受的关卡不顺延。
- **积分系统**：完成条件、获得奖励均累计积分（规则见下方）。
- **徽章成就**：共 4 枚徽章，解锁每枚奖励 +20 积分。
- **日历视图**：以日历形式查看历史完成情况。
- **自由奖励券**：允许创建 0 条件关卡，但需要消耗自由奖励券兜底；无券且无条件时拒绝创建。
- **单日关卡**：关卡只在设定当天出现（不再每日重复），切日期按该日计划加载。

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vite + React 19 |
| 路由 | React Router 7（HashRouter，兼容静态托管） |
| 样式 | Tailwind CSS 4 + lucide-react |
| 图表 | Recharts |
| 数据 | 浏览器 localStorage（`client/src/store/` 本地数据层） |

## 📁 目录结构

```
.
├── client/
│   ├── src/
│   │   ├── api/           # 数据接口层（quests / dailyPlans / points / rewardSessions / user），内部调用 store
│   │   ├── store/         # 数据层：db.js（localStorage 读写与种子数据）、index.js（全部业务逻辑）
│   │   ├── components/    # QuestCard、QuestDialog、CompleteConfirmDialog、Timer、CalendarHeatmap、LevelBadge 等
│   │   ├── context/       # 全局状态（QuestContext / UserContext）
│   │   ├── pages/         # TodayView、StatsView、PointsView、BadgesView、RewardTimer
│   │   ├── hooks/         # useTimer 等自定义 Hook
│   │   └── utils/         # calc / date / questTypes 工具
│   ├── public/
│   ├── dist/              # 构建产物（用于部署）
│   └── vite.config.js
└── README.md
```

## 🚀 本地开发

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

构建与本地预览：

```bash
npm run build      # 产物输出到 client/dist
npm run preview    # 预览构建产物（默认 http://localhost:4173）
```

## ☁️ 部署（Cloudflare Pages）

1. `cd client && npm run build`
2. Cloudflare 控制台 → **Workers & Pages → Create apps → Pages → Upload assets**
3. 上传 `client/dist` 文件夹，获得永久 `*.pages.dev` 链接

## 💾 数据存储

- 所有数据存储在浏览器 **localStorage**，键名 `reward_quest_db_v1`，以 JSON 结构模拟完整关系表（user / quests / conditions / daily_plans / reward_sessions / badges / levels / point_transactions 等）。
- **按「浏览器 + 域名」隔离**：不同浏览器、不同设备、不同域名之间数据互不相通；每个访客打开站点都拥有独立的一份数据。
- 关闭网页或浏览器不会丢失数据；清除站点数据会重置为初始种子（1 用户 / 6 等级 / 4 徽章）。
- 查看数据：DevTools → Application → Local Storage → 对应源 → `reward_quest_db_v1`。

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
