# prepare_github_release.ps1
# 自動整理 GitHub 發布檔案腳本
# 每次執行都會清空 GitHub_Release 資料夾並重新複製最新檔案

$ErrorActionPreference = "Stop"

$workspaceRoot = "c:\Users\willy\Documents\分析工具\上課"
$dest = Join-Path $workspaceRoot "資料JSON檔"
$jsonSource = Join-Path $workspaceRoot "JSON"
$crawlerSource = Join-Path $workspaceRoot "crawler\可用資料"

Write-Host "正在準備 GitHub 發布資料夾: $dest..."

# 1. 清理目標資料夾
if (Test-Path $dest) {
    Remove-Item $dest -Recurse -Force
    Write-Host "已清空舊資料。"
}
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# 2. 複製最終成果 JSON
$finalJson = Join-Path $jsonSource "data_structured_FINAL_VERIFIED.json"
if (Test-Path $finalJson) {
    Copy-Item -Path $finalJson -Destination $dest
    Write-Host "已複製: data_structured_FINAL_VERIFIED.json"
} else {
    Write-Warning "找不到最終 JSON 檔: $finalJson"
}

# 3. 複製 Raw Data
$rawDir = Join-Path $jsonSource "raw_data"
if (Test-Path $rawDir) {
    Copy-Item -Path $rawDir -Destination $dest -Recurse
    Write-Host "已複製: raw_data"
}

# 4. 複製 Cleaned Data
$cleanedDir = Join-Path $jsonSource "cleaned_data"
if (Test-Path $cleanedDir) {
    Copy-Item -Path $cleanedDir -Destination $dest -Recurse
    Write-Host "已複製: cleaned_data"
}

# 5. 複製 Crawler Data 114 & 115
$crawler114 = Join-Path $crawlerSource "114"
if (Test-Path $crawler114) {
    Copy-Item -Path $crawler114 -Destination $dest -Recurse
    Write-Host "已複製: crawler/114"
}

$crawler115 = Join-Path $crawlerSource "115"
if (Test-Path $crawler115) {
    Copy-Item -Path $crawler115 -Destination $dest -Recurse
    Write-Host "已複製: crawler/115"
}

Write-Host "`nGitHub 發布資料夾準備完成！"
Write-Host "位置: $dest"
