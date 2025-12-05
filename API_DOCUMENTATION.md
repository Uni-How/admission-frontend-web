# API 文檔

## 概述

本專案提供 RESTful API 用於查詢台灣大學入學資訊，包含學校、科系、招生資料等完整資訊。

## 基礎資訊

- **Base URL**: `https://admission-frontend-web.vercel.app`
- **格式**: JSON
- **編碼**: UTF-8

---

## API 端點

### 1. 獲取學校列表

獲取所有學校資料，包含完整的 metadata 和學校詳細資訊。

**端點**
```
GET /api/schools
```

**回應格式**
```json
{
  "metadata": {
    "academic_groups": ["工程及工程業", "資訊通訊科技", ...],
    "colleges": ["工學院", "電機資訊學院", ...],
    "regions": ["北北基", "桃竹苗", "中彰投", "雲嘉南", "高屏", "宜花東", "離島"],
    "cities": ["臺北市", "新北市", "新竹市", ...]
  },
  "schools": [
    {
      "school_id": "001",
      "school_name": "國立臺灣大學",
      "school_type": "國立",
      "school_images": ["https://..."],
      "school_url": "http://www.ntu.edu.tw",
      "campuses": [...],
      "departments": [...]
    },
    ...
  ]
}
```

**查詢參數（可選）**

| 參數 | 類型 | 說明 | 範例 |
|------|------|------|------|
| `school_id` | string | 學校代碼 | `?school_id=001` |
| `region` | string | 地區城市 | `?region=臺北市` |

**使用範例**

```javascript
// 獲取所有學校
fetch('https://admission-frontend-web.vercel.app/api/schools')
  .then(res => res.json())
  .then(data => {
    console.log('學校數量:', data.schools.length);
    console.log('可用學群:', data.metadata.academic_groups);
  });

// 查詢特定學校
fetch('https://admission-frontend-web.vercel.app/api/schools?school_id=001')
  .then(res => res.json())
  .then(data => {
    console.log(data.schools[0].school_name); // 國立臺灣大學
  });

// 查詢特定地區
fetch('https://admission-frontend-web.vercel.app/api/schools?region=臺北市')
  .then(res => res.json())
  .then(data => {
    console.log('台北市學校:', data.schools.length);
  });
```

---

## Metadata 說明

API 返回的 `metadata` 物件包含了所有可用的篩選選項，方便前端直接使用：

### academic_groups（學群）
所有科系的學群分類，例如：
- 工程及工程業
- 資訊通訊科技
- 醫藥衛生
- 商業及管理
- 等...

### colleges（學院）
所有學校的學院名稱，例如：
- 工學院
- 電機資訊學院
- 管理學院
- 等...

### regions（地區）
台灣地區分類：
- 北北基（台北市、新北市、基隆市）
- 桃竹苗（桃園市、新竹縣、新竹市、苗栗縣）
- 中彰投（台中市、彰化縣、南投縣）
- 雲嘉南（雲林縣、嘉義縣、嘉義市、台南市）
- 高屏（高雄市、屏東縣）
- 宜花東（宜蘭縣、花蓮縣、台東縣）
- 離島（澎湖縣、金門縣、連江縣）

### cities（城市）
所有學校所在的城市列表。

---

## 資料結構

### School 物件

```typescript
{
  school_id: string;           // 學校代碼
  school_name: string;         // 學校名稱
  school_type: string;         // 學校類型（國立/私立）
  school_images: string[];     // 學校圖片 URL 陣列
  school_url?: string;         // 學校官網
  campuses: Campus[];          // 校區資訊
  departments: Department[];   // 科系資訊
}
```

### Campus 物件

```typescript
{
  campus_id: string;           // 校區代碼
  campus_name: string;         // 校區名稱
  is_main: boolean;            // 是否為主校區
  location: {
    city: string;              // 城市
    district: string;          // 區域
    address: string;           // 地址
    google_map_url?: string;   // Google 地圖連結
  }
}
```

### Department 物件

```typescript
{
  department_id: string;       // 科系代碼
  department_name: string;     // 科系名稱
  college: string;             // 所屬學院
  academic_group: string;      // 學群分類
  campus_ids: string[];        // 所在校區
  department_description?: string;  // 科系簡介
  years_of_study?: number;     // 修業年限
  admission_data?: {           // 招生資料
    "114": {
      plans: {
        personal_application?: {...};      // 個人申請
        distribution_admission?: {...};    // 分發入學
        star_plan?: {...};                 // 繁星推薦
      }
    }
  }
}
```

---

## 前端整合範例

### React/Next.js 範例

```typescript
'use client';
import { useState, useEffect } from 'react';

interface Metadata {
  academic_groups: string[];
  colleges: string[];
  regions: string[];
  cities: string[];
}

interface School {
  school_id: string;
  school_name: string;
  // ... 其他欄位
}

export default function SchoolList() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  useEffect(() => {
    fetch('/api/schools')
      .then(res => res.json())
      .then(data => {
        setMetadata(data.metadata);
        setSchools(data.schools);
      });
  }, []);

  const filteredSchools = selectedRegion
    ? schools.filter(school => {
        const mainCampus = school.campuses.find(c => c.is_main);
        return mainCampus?.location.city === selectedRegion;
      })
    : schools;

  return (
    <div>
      {/* 地區篩選 */}
      <select onChange={e => setSelectedRegion(e.target.value)}>
        <option value="">所有地區</option>
        {metadata?.regions.map(region => (
          <option key={region} value={region}>{region}</option>
        ))}
      </select>

      {/* 學校列表 */}
      {filteredSchools.map(school => (
        <div key={school.school_id}>
          <h3>{school.school_name}</h3>
        </div>
      ))}
    </div>
  );
}
```

### JavaScript/HTML 範例

```html
<!DOCTYPE html>
<html>
<head>
  <title>學校查詢</title>
</head>
<body>
  <div id="filters"></div>
  <div id="schools"></div>

  <script>
    async function loadSchools() {
      const response = await fetch('https://admission-frontend-web.vercel.app/api/schools');
      const data = await response.json();
      
      // 顯示地區篩選
      const filtersDiv = document.getElementById('filters');
      data.metadata.regions.forEach(region => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = region;
        checkbox.onchange = () => filterSchools(data);
        
        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(region));
        filtersDiv.appendChild(label);
      });
      
      // 顯示學校
      displaySchools(data.schools);
    }
    
    function displaySchools(schools) {
      const schoolsDiv = document.getElementById('schools');
      schoolsDiv.innerHTML = schools.map(school => `
        <div>
          <h3>${school.school_name}</h3>
          <p>科系數：${school.departments.length}</p>
        </div>
      `).join('');
    }
    
    loadSchools();
  </script>
</body>
</html>
```

---

## 錯誤處理

API 錯誤時會返回以下格式：

```json
{
  "status": "error",
  "message": "錯誤訊息"
}
```

**HTTP 狀態碼**
- `200` - 成功
- `500` - 伺服器錯誤

---

## 效能優化建議

1. **使用 metadata 進行篩選**：前端應優先使用 `metadata` 來顯示篩選選項，避免遍歷整個 `schools` 陣列。

2. **快取策略**：metadata 變化較少，可以在客戶端快取。

3. **分頁載入**：如果需要顯示大量學校，建議在客戶端實作分頁。

4. **使用查詢參數**：當只需要特定學校時，使用 `school_id` 參數可以減少資料傳輸量。

---

## 更新日誌

### v2.0 (2025-12-05)
- ✨ 新增 `metadata` 物件，包含所有篩選選項
- 🔄 API 回應格式從陣列改為物件結構 `{ metadata, schools }`
- 🚀 效能優化：metadata 在伺服器端計算

### v1.0 (2025-12-04)
- 🎉 初始版本發布
- 📊 提供完整的學校和科系資料

---

## 聯絡方式

如有問題或建議，請透過 GitHub Issues 聯繫我們。
