'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 方法名稱對照表
const METHOD_LABELS: Record<string, string> = {
  'star_plan': '繁星',
  'personal_application': '申請',
  'distribution_admission': '分發'
};

// 科目名稱對照表
const SUBJECT_LABELS: Record<string, string> = {
  'chinese': '國',
  'english': '英',
  'mathA': '數A',
  'mathB': '數B',
  'science': '自',
  'social': '社'
};

export default function CompactSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 從 URL 讀取當前搜尋條件
  const currentYear = searchParams.get('year') || '114';
  const currentMethod = searchParams.get('method') || 'personal_application';
  const currentListening = searchParams.get('listening') || '';
  const currentGroup = searchParams.get('group') || '';
  const currentType = searchParams.get('type') || '';
  
  // States for expanded form
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [admissionMethod, setAdmissionMethod] = useState(currentMethod);
  const [scores, setScores] = useState({
    chinese: searchParams.get('chinese') || '',
    english: searchParams.get('english') || '',
    mathA: searchParams.get('mathA') || '',
    mathB: searchParams.get('mathB') || '',
    science: searchParams.get('science') || '',
    social: searchParams.get('social') || ''
  });
  const [listening, setListening] = useState(currentListening);
  const [group, setGroup] = useState(currentGroup);
  const [publicPrivate, setPublicPrivate] = useState(currentType);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // 載入學群選項
  useEffect(() => {
    async function loadMetadata() {
      try {
        const res = await fetch('/api/schools?limit=1');
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

  const LEVELS = Array.from({ length: 15 }, (_, i) => 15 - i);

  const handleYearChange = (year: string) => {
    setAcademicYear(year);
  };

  const handleScoreChange = (subject: string, value: string) => {
    setScores(prev => ({ ...prev, [subject]: value }));
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    params.set('year', academicYear);
    params.set('method', admissionMethod);
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
    setIsExpanded(false);
  };

  // 產生成績顯示字串
  const getScoresDisplay = () => {
    return Object.entries(SUBJECT_LABELS)
      .map(([id, label]) => `${label}:${scores[id as keyof typeof scores] || '--'}`)
      .join(' ');
  };

  return (
    <div className="compact-search-wrapper">
      {/* Collapsed View - Inline Bar */}
      {!isExpanded && (
        <div className="compact-search-bar" onClick={() => setIsExpanded(true)}>
          {/* 學年度 */}
          <div className="bar-section year-section">
            <span className="section-label">學年度</span>
            <span className="section-value">{currentYear}</span>
          </div>
          
          {/* 入學方式 */}
          <div className="bar-section method-section">
            <span className="section-label">入學方式</span>
            <span className="section-value">{METHOD_LABELS[currentMethod] || '申請'}</span>
          </div>

          {/* 學測成績 */}
          <div className="bar-section scores-section">
            <span className="section-label">學測成績</span>
            <span className="section-value scores-value">{getScoresDisplay()}</span>
          </div>

          {/* 英聽成績 */}
          <div className="bar-section">
            <span className="section-label">英聽成績</span>
            <span className="section-value">{currentListening || '--'}</span>
          </div>

          {/* 學群偏好 */}
          <div className="bar-section">
            <span className="section-label">學群偏好</span>
            <span className="section-value">{currentGroup || '--'}</span>
          </div>

          {/* 公/私立 */}
          <div className="bar-section">
            <span className="section-label">公/私立</span>
            <span className="section-value">{currentType || '--'}</span>
          </div>

        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="expanded-search-panel">
          <div className="expanded-header">
            <span>修改搜尋條件</span>
            <button className="close-btn" onClick={() => setIsExpanded(false)}>×</button>
          </div>
          
          <div className="search-form">
            {/* Row 1: Year, Method, Scores */}
            <div className="form-row-main">
              <div className="form-group compact">
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

              <div className="form-group compact">
                <label>入學方式</label>
                <select 
                  value={admissionMethod} 
                  onChange={(e) => setAdmissionMethod(e.target.value)}
                >
                  <option value="star_plan">繁星推薦</option>
                  <option value="personal_application">個人申請</option>
                  <option value="distribution_admission">分發入學</option>
                </select>
              </div>

              <div className="form-group scores-group flex-grow">
                <label>學測成績</label>
                <div className="scores-row">
                  {Object.entries(SUBJECT_LABELS).map(([id, label]) => (
                    <div key={id} className="score-item">
                      <span>{label}</span>
                      <select
                        value={scores[id as keyof typeof scores]}
                        onChange={(e) => handleScoreChange(id, e.target.value)}
                      >
                        <option value="">--</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Other filters + Search Button */}
            <div className="form-row-filters">
              <div className="form-group compact">
                <label>英聽</label>
                <select value={listening} onChange={(e) => setListening(e.target.value)}>
                  <option value="">不篩選</option>
                  <option value="A">A級</option>
                  <option value="B">B級</option>
                  <option value="C">C級</option>
                  <option value="F">F級</option>
                </select>
              </div>

              <div className="form-group compact">
                <label>學群</label>
                <select value={group} onChange={(e) => setGroup(e.target.value)}>
                  <option value="">全部</option>
                  {availableGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="form-group compact">
                <label>公/私立</label>
                <select value={publicPrivate} onChange={(e) => setPublicPrivate(e.target.value)}>
                  <option value="">全部</option>
                  <option value="公立">公立</option>
                  <option value="私立">私立</option>
                </select>
              </div>

              <button className="search-btn" onClick={handleSearch}>
                搜尋
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .compact-search-wrapper {
          width: 100%;
        }

        /* Compact Bar Styles */
        .compact-search-bar {
          display: flex;
          align-items: stretch;
          background: white;
          border: 2px solid #0F5AA8;
          border-radius: 30px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(11,34,64,0.08);
        }

        .compact-search-bar:hover {
          box-shadow: 0 4px 16px rgba(11,34,64,0.15);
        }

        .bar-section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8px 16px;
          border-right: 1px solid #e5e5e5;
          min-width: 80px;
        }

        .bar-section:last-of-type {
          border-right: none;
        }

        .method-section {
          background: #e8f0d8;
          border-radius: 28px 0 0 28px;
          min-width: 90px;
        }

        .scores-section {
          flex: 1;
          min-width: 280px;
        }

        .section-label {
          font-size: 0.7rem;
          color: #666;
          margin-bottom: 2px;
        }

        .section-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
        }

        .scores-value {
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .bar-section:last-child {
          border-radius: 0 28px 28px 0;
        }

        /* Expanded Panel Styles */
        .expanded-search-panel {
          background: white;
          border: 2px solid #0F5AA8;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(11,34,64,0.15);
          overflow: hidden;
        }

        .expanded-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #0F5AA8;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: white;
          line-height: 1;
          padding: 0;
        }

        .close-btn:hover {
          opacity: 0.8;
        }

        .search-form {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-row-main {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .form-row-filters {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group.compact {
          min-width: auto;
        }

        .form-group.flex-grow {
          flex: 1;
        }

        .form-group label {
          font-size: 0.7rem;
          color: #666;
          font-weight: 500;
        }

        .form-group select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.85rem;
          outline: none;
        }

        .form-group select:focus {
          border-color: #0F5AA8;
        }

        .year-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
          width: fit-content;
        }

        .year-btn {
          border: none;
          background: none;
          padding: 5px 12px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-btn.active {
          background: white;
          color: #0F5AA8;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .scores-group {
          min-width: 320px;
        }

        .scores-row {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
        }

        .score-item {
          display: flex;
          align-items: center;
          gap: 2px;
          background: #f8fafc;
          padding: 4px 6px;
          border-radius: 4px;
          border: 1px solid #eee;
        }

        .score-item span {
          font-size: 0.75rem;
          color: #666;
        }

        .score-item select {
          border: none;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 500;
          width: 40px;
          padding: 2px;
          outline: none;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .search-btn {
          background: #0F5AA8;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .search-btn:hover {
          background: #0d4a8a;
        }
      `}</style>
    </div>
  );
}
