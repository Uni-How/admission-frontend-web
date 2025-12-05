# 114 學年度繁星推薦原始資料

## 📁 資料來源
- **檔案1**: `114_繁星推薦校系資料(第一至七類學群).xlsx`
- **檔案2**: `114_繁星推薦校系資料(第八類學群).xlsx`
- **來源目錄**: `crawler/可用資料/`
- **轉換日期**: 2025-12-05

## 📊 資料說明
此資料包含 114 學年度所有大學繁星推薦入學管道的校系資訊。

### 資料分組
- **raw_group1-7.json**: 第一至七類學群（一般科系）
- **raw_group8.json**: 第八類學群（醫學系）

## 🔍 主要欄位（預期）
根據繁星推薦簡章，應包含以下欄位：
- 校名
- 校系代碼
- 系組名稱
- 招生名額
- 學測檢定標準
- 在學學業成績要求
  - 全校排名百分比
  - 特定科目排名百分比

## 📝 使用方式
```python
import json

# 讀取第一至七類學群
with open('raw_group1-7.json', 'r', encoding='utf-8') as f:
    group1_7 = json.load(f)

# 讀取第八類學群（醫學系）
with open('raw_group8.json', 'r', encoding='utf-8') as f:
    group8 = json.load(f)

# 合併資料
all_data = group1_7 + group8

print(f"第一至七類: {len(group1_7)} 筆")
print(f"第八類(醫學): {len(group8)} 筆")
print(f"總共: {len(all_data)} 筆")
```

## 🎯 後續處理
此資料需要經過清洗腳本處理，提取需要的欄位並整合到 `data_structured_20251204.json`

**清洗腳本**: `scripts/clean_star_plan.py`
