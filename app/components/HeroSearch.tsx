'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// --- HeroSearch Component (首頁搜尋組件) ---
// 這是使用者與系統互動的第一個入口，負責收集所有篩選條件。

export default function HeroSearch() {
  const router = useRouter();
  
  // States (表單狀態)
  const [academicYear, setAcademicYear] = useState('114'); // Default 114學年度
  const [admissionMethod, setAdmissionMethod] = useState('personal_application'); // 預設個人申請
  
  // 成績輸入狀態 (對應各科目)
  // 這裡使用 string 是為了方便處理空值輸入
  const [scores, setScores] = useState({
    chinese: '',
    english: '',
    mathA: '',
    mathB: '',
    science: '',
    social: ''
  });
  const [listening, setListening] = useState(''); // 初始為空（無=不篩選）
  const [group, setGroup] = useState('');         // 學群
  const [publicPrivate, setPublicPrivate] = useState(''); // 公私立
  
  // 新增：從 API 載入的學群選項 (Dynamic Metadata)
  // 透過 API 獲取資料庫中實際存在的學群列表，避免寫死
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // 載入學群選項
  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/schools?limit=1'); // 請求少量資料以取得 metadata
        const data = await res.json();
        if (data.metadata?.academic_groups) {
          setAvailableGroups(data.metadata.academic_groups);
        }
      } catch (error) {
        console.error('Failed to load metadata:', error);
      }
    }
    loadMetadata();
  }, []);

  // Logic: Handle year changes
  const handleYearChange = (year: string) => {
    setAcademicYear(year);
  };

  // 15 to 1 (級分下拉選單生成用)
  const LEVELS = Array.from({ length: 15 }, (_, i) => 15 - i);

  const handleScoreChange = (subject: string, value: string) => {
    setScores(prev => ({ ...prev, [subject]: value }));
  };

  // Handle Search (執行搜尋)
  // 將所有狀態組合成 URL Query Params 並跳轉至 /results 頁面
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.set('year', academicYear);
    params.set('method', admissionMethod);
    // 僅加入有填寫的成績
    if (scores.chinese) params.set('chinese', scores.chinese);
    if (scores.english) params.set('english', scores.english);
    if (scores.mathA) params.set('mathA', scores.mathA);
    if (scores.mathB) params.set('mathB', scores.mathB);
    if (scores.science) params.set('science', scores.science);
    if (scores.social) params.set('social', scores.social);
    
    if (listening) params.set('listening', listening);
    if (group) params.set('group', group);
    if (publicPrivate) params.set('type', publicPrivate);

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="hero-search-container">
      {/* Tab Navigation */}
      <div className="hero-tabs">
        <button className="hero-tab active">以成績搜尋</button>
        <button className="hero-tab">以校名搜尋</button>
        <div className="code-search">
          <input type="text" placeholder="資料代碼" />
          <button className="code-check">✓</button>
        </div>
        <button className="hero-tab-pill">進階搜尋</button>
      </div>

      {/* Main Filter Bar */}
      <div className="filter-bar">
        {/* Academic Year */}
        <div className="filter-group year">
          <label>學年度</label>
          <div className="year-toggle">
             <button 
               className={`year-btn ${academicYear === '114' ? 'active' : ''}`}
               onClick={() => handleYearChange('114')}
             >
               114
             </button>
             <button 
               className={`year-btn ${academicYear === '115' ? 'active' : ''}`}
               onClick={() => handleYearChange('115')}
             >
               115
             </button>
          </div>
        </div>

        {/* Admission Method */}
        <div className="filter-group method">
          <label>入學方式</label>
          <select 
            value={admissionMethod} 
            onChange={(e) => setAdmissionMethod(e.target.value)}
            className="filter-select"
          >
            <option value="star_plan">繁星推薦</option>
            <option value="personal_application">個人申請</option>
            <option value="distribution_admission">分發入學</option>
          </select>
        </div>

        {/* Scores Input */}
        <div className="filter-group scores">
          <label>學測成績 (級分)</label>
          <div className="score-inputs">
            {[
              { id: 'chinese', label: '國' },
              { id: 'english', label: '英' },
              { id: 'mathA', label: '數A' },
              { id: 'mathB', label: '數B' },
              { id: 'science', label: '自' },
              { id: 'social', label: '社' }
            ].map((subject) => (
              <div key={subject.id} className="score-input">
                <span>{subject.label}:</span>
                <select
                  value={scores[subject.id as keyof typeof scores]}
                  onChange={(e) => handleScoreChange(subject.id, e.target.value)}
                  className="mini-select"
                >
                  <option value="">--</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Listening */}
        <div className="filter-group listening">
          <label>英聽</label>
          <select 
            value={listening} 
            onChange={(e) => setListening(e.target.value)}
            className="filter-select"
          >
            <option value="">無（不篩選）</option>
            <option value="A">A級</option>
            <option value="B">B級</option>
            <option value="C">C級</option>
            <option value="F">F級</option>
          </select>
        </div>

        {/* Academic Group */}
        <div className="filter-group group-pref">
          <label>學群偏好</label>
          <select 
            value={group} 
            onChange={(e) => setGroup(e.target.value)}
            className="filter-select"
          >
            <option value="">全部</option>
            {availableGroups.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Public/Private */}
        <div className="filter-group type">
          <label>公/私立</label>
          <select 
            value={publicPrivate} 
            onChange={(e) => setPublicPrivate(e.target.value)}
            className="filter-select"
          >
            <option value="">全部</option>
            <option value="公立">公立</option>
            <option value="私立">私立</option>
          </select>
        </div>

        {/* Search Button */}
        <button className="search-btn" onClick={handleSearch}>
          搜尋
        </button>
      </div>

      <style jsx>{`
        .hero-search-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          font-family: 'Outfit', sans-serif;
        }

        .hero-tabs {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 0px; 
          /* Design implies attached to filter bar */
        }

        .hero-tab {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .hero-tab.active {
          background: #3b82f6; /* Blue accent */
          border-color: #3b82f6;
          color: white;
        }

        .code-search {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 20px;
          padding: 2px 4px 2px 12px;
          margin-left: 8px;
        }

        .code-search input {
          border: none;
          outline: none;
          width: 80px;
          font-size: 0.9rem;
        }

        .code-check {
          background: none;
          border: 1px solid #333;
          border-radius: 4px;
          cursor: pointer;
          padding: 0 4px;
          font-size: 0.8rem;
        }

        .hero-tab-pill {
          background: white;
          border: none;
          border-radius: 20px;
          padding: 6px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          margin-left: auto;
        }

        .filter-bar {
          background: white;
          border-radius: 20px; /* Rounded corners as per image */
          padding: 10px;
          display: flex;
          align-items: stretch;
          gap: 0; /* Removing gap to have borders between them */
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden; /* For inner borders */
          border: 1px solid #e1e1e1;
        }

        .filter-group {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-right: 1px solid #eee;
          min-width: 80px;
        }

        .filter-group:last-of-type {
          border-right: none;
        }

        .filter-group label {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .filter-select {
          border: none;
          background: none;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
          outline: none;
          cursor: pointer;
          padding: 0;
          width: 100%;
        }

        .method {
           background: #fae8b4; /* Light yellow background for active section */
           border-radius: 12px 0 0 12px;
           margin: -10px 0 -10px -10px; /* Expand to fill */
           padding: 10px 20px;
        }

        .scores {
          flex: 2; /* Take more space */
        }

        .score-inputs {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap; /* Allow wrapping on small screens */
        }
        
        .score-input {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap; /* Prevent label wrapping */
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }

        .mini-select {
          border: none;
          background: transparent;
          border-bottom: 1px solid #ccc;
          font-size: 0.95rem;
          font-weight: 500;
          color: #333;
          outline: none;
          width: 50px; /* Wider for 2 digits */
          padding: 0;
          cursor: pointer;
        }

        .mini-select:focus {
          border-color: #3b82f6;
        }

        .search-btn {
          background: #0f172a; /* Dark blue */
          color: white;
          border: none;
          border-radius: 14px;
          padding: 0 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-left: 10px; /* Space from last item */
          white-space: nowrap;
        }

        .search-btn:hover {
          background: #1e293b;
        }

        .year-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }

        .year-btn {
          border: none;
          background: none;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-btn.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
