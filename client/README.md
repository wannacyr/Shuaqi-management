# client（前端）

本应用的完整实现为纯前端（Vite + React 19），无后端服务。

- 数据层：`src/store/`（`db.js` 负责 localStorage 持久化与种子数据，`index.js` 承载全部业务逻辑）
- 接口层：`src/api/` 为 store 的封装，供 context / 页面调用

```bash
npm install
npm run dev       # 开发（http://localhost:5173）
npm run build     # 构建到 dist/
npm run preview   # 预览构建产物
```

详见根目录 [README](../README.md)。
