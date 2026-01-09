'use client';

interface FilterSidebarProps {
  metadata: {
    regions: string[];
    academic_groups: string[];
  };
  selectedRegions: string[];
  selectedGroups: string[];
  filteredCount: number;
  onToggleRegion: (region: string) => void;
  onToggleGroup: (group: string) => void;
  onClearFilters: () => void;
}

// --- FilterSidebar Component (篩選側邊欄) ---
// 這是一個 Controlled Component (受控組件)，
// 其狀態 (selectedRegions, selectedGroups) 完全由父組件 (ResultsPage) 管理。

export default function FilterSidebar({
  metadata,
  selectedRegions,
  selectedGroups,
  filteredCount,
  onToggleRegion,
  onToggleGroup,
  onClearFilters,
}: FilterSidebarProps) {
  const hasActiveFilters = selectedRegions.length > 0 || selectedGroups.length > 0;

  return (
    <aside className="sidebar">
      <div className="muted-row">
        <span>篩選結果：{filteredCount} 所學校</span>
        {hasActiveFilters && (
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              onClearFilters();
            }}
          >
            清除
          </a>
        )}
      </div>

      <div className="filter-group">
        <button className="filter-title" aria-expanded="true">
          <span>地區：</span>
          <span className="caret"></span>
        </button>
        <div className="checklist">
          {(metadata.regions.length > 0 ? [...metadata.regions].sort() : ['北北基', '桃竹苗', '宜花東', '中彰投', '雲嘉南', '高屏', '離島']).map(region => (
            <label key={region}>
              <input 
                type="checkbox" 
                checked={selectedRegions.includes(region)}
                onChange={() => onToggleRegion(region)}
              /> {region}
            </label>
          ))}
        </div>
      </div>

      <hr className="sep" />

      <div className="filter-group">
        <button className="filter-title" aria-expanded="true">
          <span>學群：</span>
          <span className="caret"></span>
        </button>
        <div className="checklist long">
          {(metadata.academic_groups.length > 0 ? [...metadata.academic_groups].sort((a, b) => a.localeCompare(b, 'zh-TW')) : []).map(group => (
            <label key={group}>
              <input 
                type="checkbox" 
                checked={selectedGroups.includes(group)}
                onChange={() => onToggleGroup(group)}
              /> {group}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
