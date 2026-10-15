# 每日奖励关卡规划器（Daily Playbook）

一个以「奖励关卡」为核心的日程与自律工具：把每日待办事项作为**前置条件**，完成全部条件后解锁当日的**奖励**。完成条件和获得奖励都能累计积分，并通过日历、徽章、积分明细等视图反馈进度。

**纯前端应用**：无后端、无数据库服务，全部数据存储在浏览器 localStorage 中，可作为静态站点直接部署。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vite + React 19 |
| 路由 | React Router 7（HashRouter，兼容静态托管） |
| 样式 | Tailwind CSS 4 + lucide-react |
| 图表 | Recharts |
| 数据 | 浏览器 localStorage（`client/src/store/` 本地数据层） |

## 目录结构

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

## 本地开发

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

更新：
```bash
npm run build && npm run deploy    # 更新线上页面
git add -A && git commit -m "..." && git push   # 备份源码到 main,"..." 是占位符，要换成一句话描述你这次改了什么

## 数据存储

- 所有数据存储在浏览器 **localStorage**，键名 `reward_quest_db_v1`，以 JSON 结构模拟完整关系表（user / quests / conditions / daily_plans / reward_sessions / badges / levels / point_transactions 等）。
- **按「浏览器 + 域名」隔离**：不同浏览器、不同设备、不同域名之间数据互不相通；每个访客打开站点都拥有独立的一份数据。
- 关闭网页或浏览器不会丢失数据；清除站点数据会重置为初始种子（1 用户 / 6 等级 / 4 徽章）。
- 查看数据：DevTools → Application → Local Storage → 对应源 → `reward_quest_db_v1`。

## 积分规则

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
