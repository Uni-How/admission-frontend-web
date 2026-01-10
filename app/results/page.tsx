'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import SchoolCard from '../components/SchoolCard';
import SchoolDetail from '../components/SchoolDetail';
import DepartmentList from '../components/DepartmentList';
import CompactSearchBar from '../components/CompactSearchBar';
import { SchoolCardSkeleton, DepartmentListSkeleton, SchoolDetailSkeleton } from '../components/Skeleton';
import { useSearchParams } from 'next/navigation';
import './results.css';

interface ISchool {
  _id: string;
  school_id: string;
  school_name: string;
  school_type: string;
  school_images: string[];
  school_url?: string;
  campuses: {
    campus_id: string;
    campus_name: string;
    is_main: boolean;
    location: {
      city: string;
      district: string;
      address: string;
      google_map_url?: string;
    };
  }[];
  departments: {
    department_id: string;
    department_name: string;
    college: string;
    academic_group: string;
    campus_ids: string[];
    admission_data?: any;
  }[];
}

// --- Results Page Component (搜尋結果主頁) ---
// 負責處理資料載入、無限捲軸、以及客戶端即時篩選

function ResultsContent() {
  const searchParams = useSearchParams();
  
  // 1. State Management (狀態管理)
  // schools: 從 API 累資取得的所有學校資料 (隨著捲軸向下會越來越多)
  const [schools, setSchools] = useState<ISchool[]>([]); 
  
  // filteredSchools: 根據側邊欄條件 (地區、學群) 二次篩選後的結果
  // 這是實際顯示在畫面上的列表
  const [filteredSchools, setFilteredSchools] = useState<ISchool[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<ISchool | null>(null);
  
  // 新增：科系選擇狀態 (從 SchoolDetail 提升到這裡)
  // 從 URL 讀取年份，確保與搜尋條件一致
  const [selectedYear, setSelectedYear] = useState<'114' | '115'>((searchParams.get('year') || '114') as '114' | '115');
  const [selectedDeptIndex, setSelectedDeptIndex] = useState<number>(0);
  
  // 同步 URL 年份變化
  useEffect(() => {
    const yearFromUrl = (searchParams.get('year') || '114') as '114' | '115';
    setSelectedYear(yearFromUrl);
  }, [searchParams]);
  
  // Pagination State (分頁狀態)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // 是否還有更多資料
  const [isFetching, setIsFetching] = useState(false); // 避免重複請求
  const [totalCount, setTotalCount] = useState(0); // 總筆數
  
  // Metadata state (從後端取得的可選篩選項目)
  const [metadata, setMetadata] = useState<{
    academic_groups: string[];
    colleges: string[];
    regions: string[];
    cities: string[];
  }>({
    academic_groups: [],
    colleges: [],
    regions: [],
    cities: []
  });

  // Client-Side Filter states (側邊欄篩選狀態)
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  // Observer Ref (用於偵測是否捲動到底部)
  const observerTarget = useRef(null);

  // 2. Fetch Function (資料獲取函式)
  // 核心邏輯：支援「追加 (Append)」與「刷新 (Refresh)」兩種模式
  const fetchSchools = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
      if (isFetching) return; // 防重入鎖
      setIsFetching(true);

      try {
        const params = new URLSearchParams(searchParams.toString());
        params.set('limit', '12'); // 每次載入 12 筆
        params.set('page', pageNum.toString());

        const res = await fetch(`/api/schools?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        if (data.metadata) setMetadata(data.metadata);
        
         if (data.schools) {
           const newSchools = data.schools;
           setTotalCount(data.pagination?.total || 0);
           setHasMore(data.pagination?.hasMore || false);

           if (isRefresh) {
             // 模式 A: 刷新頁面 (例如重新搜尋) -> 覆蓋舊資料
             setSchools(newSchools);
             // 預設選取第一所學校
             if (newSchools.length > 0) {
                setSelectedSchool(newSchools[0]);
                checkAndFetchDetail(newSchools[0]);
             } else {
                setSelectedSchool(null);
             }
           } else {
             // 模式 B: 無限捲軸 -> 追加新資料到現有陣列後方
             setSchools(prev => {
                const existingIds = new Set(prev.map(s => s._id));
                // 過濾掉可能重複的資料 (以防萬一)
                const uniqueNew = newSchools.filter((s: ISchool) => !existingIds.has(s._id));
                return [...prev, ...uniqueNew];
             });
           }
         }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setIsFetching(false);
      }
  }, [searchParams, isFetching]);

  // Helper: 檢查並補完詳細資料 (若學校 card 資料不全，則單獨 fetch 詳細版)
  const checkAndFetchDetail = async (school: ISchool) => {
      const needsDetail = school.departments.some(d => !d.admission_data);
      if (needsDetail) {
         try {
             // [Fix] 必須將原本的搜尋條件 (searchParams) 一併帶入，
             // 否則後端會變成 "Simple Query Mode" 導致回傳所有科系 (而非篩選後的科系)，
             // 造成列表的可填科系數量異常跳動 (例如從 8 變成 33)。
             const params = new URLSearchParams(searchParams.toString());
             params.set('school_id', school.school_id);
             params.set('detail', 'true');
             
             // 避免不必要的參數干擾 (例如 limit/page 不需帶入，因為這裡指定了一所學校)
             params.delete('page');
             params.delete('limit');

             const res = await fetch(`/api/schools?${params.toString()}`);
             const data = await res.json();
             if (data.schools?.[0]) {
                 const full = data.schools[0];
                 setSelectedSchool(full);
                 // 同步更新列表中的該筆資料，避免再次點擊時重抓
                 setSchools(prev => prev.map(s => s.school_id === full.school_id ? full : s));
             }
         } catch(e) { console.error(e); }
      } else {
          setSelectedSchool(school);
      }
  };

  // 3. Effect: URL Search Params Change (當搜尋條件改變時)
  // 重置頁面並重新抓取第一頁
  useEffect(() => {
     const reset = async () => {
         setPage(1);
         setHasMore(true);
         setSchools([]); // 清空列表以顯示載入狀態
         await fetchSchools(1, true); // true = Refresh Mode
     };
     reset();
  }, [searchParams]);

  // 4. Effect: Infinite Scroll (Observer) - 無限捲軸監聽
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // 當觀察目標 (observerTarget) 進入畫面，且還有更多資料 (hasMore) 且非載入中 (!isFetching)
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage(prev => {
             const next = prev + 1;
             fetchSchools(next, false); // false = Append Mode (追加資料)
             return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: '100px' } // 預先載入，當距離底部 100px 時觸發
    );
    
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [hasMore, isFetching]); // fetchSchools stable

  // 5. Effect: Apply Client-Side Filters (Sidebar) - 客戶端篩選
  // 這些篩選是在「已載入的資料」上進行二次過濾，不重新請求 API。
  // 優點：回應即時，不需要等待伺服器。
  // 缺點：只能篩選「目前已載入」的資料 (但在無限捲軸模式下，通常是針對已看過的資料做進一步限縮)
  useEffect(() => {
    let filtered = schools;

    // Region filter (地區篩選)
    // 檢查學校的主校區是否位於選定的地區 (北北基 / 桃竹苗...)
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(school => {
        const mainCampus = school.campuses.find(c => c.is_main);
        const city = mainCampus?.location.city || '';
        return selectedRegions.some(region => {
          if (region === '北北基') return ['臺北市', '新北市', '基隆市'].includes(city);
          if (region === '桃竹苗') return ['桃園市', '新竹縣', '新竹市', '苗栗縣'].includes(city);
          if (region === '中彰投') return ['臺中市', '彰化縣', '南投縣'].includes(city);
          if (region === '雲嘉南') return ['雲林縣', '嘉義縣', '嘉義市', '臺南市'].includes(city);
          if (region === '高屏') return ['高雄市', '屏東縣'].includes(city);
          if (region === '宜花東') return ['宜蘭縣', '花蓮縣', '臺東縣'].includes(city);
          if (region === '離島') return ['澎湖縣', '金門縣', '連江縣'].includes(city);
          return false;
        });
      });
    }

    // Academic group filter (學群篩選)
    // 檢查學校是否擁有屬於選定學群的科系
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(school => {
        return school.departments.some(dept => {
          const group = dept.academic_group || '其他';
          return selectedGroups.includes(group);
        });
      });
    }

    setFilteredSchools(filtered); // 更新顯示列表
    
    // Auto-select first if none selected or current filtered out
    // 若原選取的學校被篩掉了，自動選取篩選結果的第一所，以維持 UX 連續性
    if (filtered.length > 0) {
        if (!selectedSchool || !filtered.find(s => s._id === selectedSchool._id)) {
            setSelectedSchool(filtered[0]);
            checkAndFetchDetail(filtered[0]);
        }
    } else {
        setSelectedSchool(null);
    }
    
  }, [selectedRegions, selectedGroups, schools]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const handleSchoolClick = (school: ISchool) => {
    setSelectedSchool(school);
    setSelectedDeptIndex(0); // 重置科系選擇
    checkAndFetchDetail(school);
  };

  // Scroll handling for header visibility
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  
  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const leftPanel = leftPanelRef.current;
    if (!leftPanel) return;

    const handleScroll = () => {
      const currentScrollY = leftPanel.scrollTop;
      
      // 向上捲動時顯示 header，向下捲動時隱藏
      if (currentScrollY < lastScrollY.current) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setHeaderVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    leftPanel.addEventListener('scroll', handleScroll, { passive: true });
    return () => leftPanel.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close filter panel when clicking outside or pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFilterOpen(false);
    };
    
    if (filterOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent body scroll when filter open
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [filterOpen]);
  
  // Calculate active filter count
  const activeFilterCount = selectedRegions.length + selectedGroups.length;

  return (
    <div className="results-page">
      {/* Fixed Header Area */}
      <div className={`results-header ${headerVisible ? 'visible' : 'hidden'}`}>
        <div className="header-inner-row">
          <a href="/" className="header-logo">UniHow</a>
          <div className="header-search-bar">
            <CompactSearchBar />
          </div>
        </div>
      </div>

      {/* Filter Overlay */}
      <div 
        className={`filter-overlay ${filterOpen ? 'visible' : ''}`}
        onClick={() => setFilterOpen(false)}
      />

      {/* Filter Panel (Floating) */}
      <div className={`filter-panel ${filterOpen ? 'open' : ''}`}>
        <div className="filter-panel-header">
          <h3>篩選條件</h3>
          <button className="filter-close-btn" onClick={() => setFilterOpen(false)}>×</button>
        </div>
        <div className="filter-panel-content">
          <FilterSidebar 
            metadata={metadata}
            selectedRegions={selectedRegions}
            selectedGroups={selectedGroups}
            filteredCount={totalCount} 
            onToggleRegion={toggleRegion}
            onToggleGroup={toggleGroup}
            onClearFilters={() => {
              setSelectedRegions([]);
              setSelectedGroups([]);
            }}
          />
        </div>
      </div>

      {/* Results Toolbar */}
      <div className="results-toolbar">
        <h2>篩選結果 : {totalCount} 所學校</h2>
        <button 
          className="filter-toggle-btn"
          onClick={() => setFilterOpen(true)}
        >
          <span className="filter-icon">☰</span>
          <span>進階篩選</span>
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <main className={`results-main ${headerVisible ? 'header-visible' : 'header-hidden'}`}>
        {/* Left Panel: School List (獨立捲動) */}
        <div className="left-panel" ref={leftPanelRef}>
          <section className="school-list">
            <div className="space-y-4">
               {/* Initial Loading Skeletons */}
               {isFetching && schools.length === 0 && (
                  <>
                    <SchoolCardSkeleton />
                    <SchoolCardSkeleton />
                    <SchoolCardSkeleton />
                    <SchoolCardSkeleton />
                  </>
               )}
               
               {filteredSchools.map((school) => (
                  <SchoolCard 
                    key={school._id} 
                    school={school} 
                    isSelected={selectedSchool?._id === school._id}
                    onClick={() => handleSchoolClick(school)}
                  />
               ))}
               
               {/* Infinite Scroll Loading */}
               {isFetching && schools.length > 0 && (
                  <>
                    <SchoolCardSkeleton />
                    <SchoolCardSkeleton />
                  </>
               )}
               
               <div ref={observerTarget} style={{ height: '20px', marginTop: '10px' }}></div>

              {!isFetching && filteredSchools.length === 0 && schools.length > 0 && (
                 <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                   符合條件的學校已被篩選移除 (請清除左側篩選)
                 </div>
              )}

              {!isFetching && schools.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                  沒有符合條件的學校
                </div>
              )}
              
              {!hasMore && schools.length > 0 && (
                 <div className="text-center py-4 text-gray-400 text-sm">
                    已經到底囉
                 </div>
              )}
            </div>
          </section>
        </div>

        {/* Middle Panel: Department List (獨立捲動) */}
        <div className="middle-panel">
          {isFetching && schools.length === 0 ? (
            <DepartmentListSkeleton />
          ) : (
            <DepartmentList
              school={selectedSchool}
              selectedYear={selectedYear}
              selectedDeptIndex={selectedDeptIndex}
              onSelectDept={setSelectedDeptIndex}
              onYearChange={setSelectedYear}
            />
          )}
        </div>

        {/* Right Panel: Detail Card (獨立捲動) */}
        <div className="right-panel">
          {isFetching && schools.length === 0 ? (
            <SchoolDetailSkeleton />
          ) : (
            <SchoolDetail 
              school={selectedSchool} 
              selectedYear={selectedYear}
              selectedDeptIndex={selectedDeptIndex}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Suspense Boundary wrapper for useSearchParams
export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{padding: '2rem'}}>載入頁面中...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
