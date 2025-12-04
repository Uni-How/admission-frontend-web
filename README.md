# 大學招生資訊平台

這是一個基於 Next.js 的大學招生資訊查詢平台，整合 MongoDB 後端，提供完整的學校、系所和招生資料查詢功能。

## 🚀 功能特色

- ✅ 動態學校資料展示
- ✅ 地區篩選（北北基、桃竹苗、中彰投等）
- ✅ 學群篩選（資訊、工程、醫藥衛生等 18 種學群）
- ✅ 詳細系所資訊顯示
- ✅ 響應式設計（支援桌面和行動裝置）
- ✅ MongoDB 資料庫整合

## 📋 技術棧

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes, Mongoose
- **Database**: MongoDB Atlas
- **Styling**: Custom CSS
- **Deployment**: Vercel

## 🛠️ 開發環境設置

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數設置

複製 `.env.example` 並重命名為 `.env.local`：

```bash
cp .env.example .env.local
```

然後編輯 `.env.local`，填入您的 MongoDB 連接字串：

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### 3. 數據庫初始化

使用測試資料初始化數據庫：

```bash
npx tsx scripts/seed_db.ts
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 📁 專案結構

```
├── app/
│   ├── api/
│   │   └── schools/
│   │       └── route.ts       # 學校資料 API
│   ├── globals.css             # 全局樣式
│   ├── layout.tsx              # 布局組件
│   └── page.tsx                # 主頁面
├── models/
│   └── School.ts               # Mongoose Schema
├── lib/
│   └── mongodb.ts              # MongoDB 連接
├── scripts/
│   ├── seed_db.ts              # 數據庫初始化腳本
│   └── validate_crawler_data.ts # 資料驗證工具
├── JSON/
│   ├── standard.json           # 資料格式規範
│   ├── README.md               # 資料規範文檔
│   └── configs/
│       └── assessment_standards_114.json # 學測級分標準
└── public/
    └── unihow.css              # UI 樣式表
```

## 🗃️ 資料格式

詳細的 JSON 資料格式規範請參考：
- [JSON/standard.json](./JSON/standard.json) - 完整資料結構範例
- [JSON/README.md](./JSON/README.md) - 資料規範說明文檔

### 資料驗證

使用內建的驗證工具檢查資料格式：

```bash
npx tsx scripts/validate_crawler_data.ts JSON/your_data.json
```

## 🚢 部署到 Vercel

### 方法 1: 使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 方法 2: 透過 GitHub

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 匯入 GitHub 專案
3. 設置環境變數 `MONGODB_URI`
4. 點擊部署

### 環境變數設置

在 Vercel Dashboard 中設置：
- `MONGODB_URI`: 您的 MongoDB Atlas 連接字串

## 📊 API 端點

### GET /api/schools

取得所有學校資料

**範例請求**:
```bash
curl http://localhost:3000/api/schools
```

**範例回應**:
```json
[
  {
    "_id": "...",
    "school_id": "001",
    "school_name": "國立政治大學",
    "school_type": "國立",
    "campuses": [...],
    "departments": [...]
  }
]
```

## 🧪 測試

目前測試狀態：
- ✅ MongoDB 連接測試
- ✅ API 端點測試
- ✅ 前端渲染測試
- ✅ 篩選功能測試

## 📝 開發規範

### 資料缺失處理

當爬蟲無法取得資料時：
- 必填字串：使用 `"未知"` 或 `"未分類"`
- 必填數字：使用 `0`
- 必填陣列：使用 `[]`
- 選填欄位：使用 `null` 或省略

詳細規範請參考 [JSON/README.md](./JSON/README.md)

## 🔧 故障排除

### MongoDB 連接失敗

確認：
1. `.env.local` 中的 `MONGODB_URI` 格式正確
2. MongoDB Atlas 允許您的 IP 訪問
3. 資料庫名稱已包含在連接字串中

### 頁面無法載入

1. 檢查開發伺服器是否正在運行
2. 清除瀏覽器快取
3. 檢查控制台是否有錯誤訊息

## 📚 相關文檔

- [Next.js 文檔](https://nextjs.org/docs)
- [MongoDB 文檔](https://docs.mongodb.com/)
- [Mongoose 文檔](https://mongoosejs.com/docs/)

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issue 和 Pull Request！

---

**最後更新**: 2025-12-04
