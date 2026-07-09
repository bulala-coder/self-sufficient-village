# 自足村 Self-Sufficient Village v1.5

這是「示意圖背景版」：首頁直接使用水墨介面圖作為視覺基底，讓首頁更接近你指定的山水墨畫設計。

## 本機啟動

```bash
npm config set registry https://registry.npmjs.org/
rm -rf node_modules
rm -f package-lock.json
npm install
npm run dev
```

開啟：

```text
http://localhost:5173/
```

## 說明

- 首頁視覺以 `public/dashboard-bg.png` 為主。
- 首頁的「開始任務」、「問 AI 村長」與底部導覽是透明可點擊熱區。
- 其他頁面維持原本 React 功能。
- 這版優先解決視覺信心問題，後續再把動態內容逐步重建成真正元件。
