# Fortress OS｜自足堡壘

家庭韌性、補給中斷與自給生存管理系統。

這是公開試用用的本機版 React + Vite App，重點是讓使用者盤點家庭韌性、補給缺口、風險情境、撤離包與下一步行動。

## 功能

- Dashboard：家庭韌性狀態、最高缺口、今日任務與作戰工具入口。
- Mission System：硬核任務系統，依水、食物、電力、醫療、動物、地形與撤離缺口建立行動清單。
- Risk Matrix：家庭風險矩陣，依住所、地形、補給與醫療距離推估環境風險。
- Inventory 2.0：補給庫存、保存期限、高優先物資與補給缺口管理。
- Tools Hub：集中進入撤離包、硬核計算器、72 小時備災與食物生產。
- Scenario Drills：情境演練與通過標準檢查。
- Evacuation Kit：撤離包內容、重量、到期品與最高缺口管理。
- Export Report：作戰報告，整合補給、演練、任務、風險與撤離包摘要。
- Offline Manual：離線生存手冊，提供停水、停電、地震、颱風、醫療與地形風險流程。

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
- 資料保存在瀏覽器 localStorage，目前不跨裝置同步。
- 不需要登入、Supabase 或真 AI 服務。
- package name 與 repo/base 路徑保留既有設定，避免影響部署。
