# 114 學年度招生資料 Raw JSON

**目錄**: `JSON/raw_data/114_ALL/`  
**更新日期**: 2025-12-05

---

## 📁 檔案列表

| 檔案名稱 | 說明 | 筆數 | 原始位置 |
|----------|------|------|----------|
| 114_personal_application_raw.json | 個人申請 | 2168 | 114_personal_application\raw.json |
| 114_star_plan_group1-7_raw.json | 繁星推薦(第1-7類學群) | 1694 | 114_star_plan\raw_group1-7.json |
| 114_star_plan_group8_raw.json | 繁星推薦(第8類-醫學) | 18 | 114_star_plan\raw_group8.json |
| 114_distribution_raw.json | 分發入學 | 1781 | 114_distribution\raw.json |

---

## 📝 檔案命名規則

格式: `114_<入學管道>_[分類]_raw.json`

- `114_personal_application_raw.json` - 個人申請
- `114_distribution_raw.json` - 分發入學
- `114_star_plan_group1-7_raw.json` - 繁星推薦(第1-7類)
- `114_star_plan_group8_raw.json` - 繁星推薦(第8類)

---

## 🎯 使用方式

```python
import json

# 讀取個人申請資料
with open('114_personal_application_raw.json', 'r', encoding='utf-8') as f:
    personal_data = json.load(f)

print(f'個人申請: {len(personal_data)} 筆')
```
