# Fortress OS｜自足堡壘

家庭韌性、補給中斷、風險矩陣、硬核任務、情境演練、離線手冊與作戰報告系統。

## 本機啟動

```bash
npm install
npm run dev
```

開啟：

```text
http://localhost:5173/self-sufficient-village/
```

## 建置

```bash
npm run build
```

## GitHub Pages 部署

```bash
npm run deploy
```

目前 Vite base 保留為 `/self-sufficient-village/`，以維持既有 GitHub Pages repo 部署路徑。

## 說明

- 使用 React + Vite。
- 資料保存在瀏覽器 localStorage。
- 不需要登入、Supabase 或真 AI 服務。
- package name 與 repo/base 路徑保留既有設定，避免影響部署。
