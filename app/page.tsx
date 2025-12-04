'use client';

import { useState, useEffect } from 'react';

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
    academic_group: string; // NEW
    campus_ids: string[];
    admission_data?: any;
  }[];
}

export default function Home() {
  const [schools, setSchools] = useState<ISchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<ISchool[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<ISchool | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSchools() {
      try {
        const res = await fetch('/api/schools');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSchools(data);
        setFilteredSchools(data);
        if (data.length > 0) {
          setSelectedSchool(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch schools:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSchools();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = schools;

    // Region filter
    if (selectedRegions.length > 0) {
      filtered = filtered.filter(school => {
        const mainCampus = school.campuses.find(c => c.is_main);
        const city = mainCampus?.location.city || '';
        
        return selectedRegions.some(region => {
          if (region === '北北基') return city.includes('台北') || city.includes('新北') || city.includes('基隆');
          if (region === '桃竹苗') return city.includes('桃園') || city.includes('新竹') || city.includes('苗栗');
          if (region === '中彰投') return city.includes('台中') || city.includes('彰化') || city.includes('南投');
          if (region === '雲嘉南') return city.includes('雲林') || city.includes('嘉義') || city.includes('台南');
          if (region === '高屏金') return city.includes('高雄') || city.includes('屏東') || city.includes('金門');
          if (region === '宜花東') return city.includes('宜蘭') || city.includes('花蓮') || city.includes('台東');
          return false;
        });
      });
    }

    // Academic group filter
    if (selectedGroups.length > 0) {
      filtered = filtered.filter(school => {
        return school.departments.some(dept => 
          selectedGroups.includes(dept.academic_group)
        );
      });
    }

    setFilteredSchools(filtered);
    
    // Auto-select first filtered school
    if (filtered.length > 0) {
      setSelectedSchool(filtered[0]);
    } else {
      setSelectedSchool(null);
    }
  }, [selectedRegions, selectedGroups, schools]);

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  // Get main campus location
  const getMainLocation = (school: ISchool) => {
    const mainCampus = school.campuses.find(c => c.is_main);
    if (mainCampus) {
      return `${mainCampus.location.city}${mainCampus.location.district}`;
    }
    return school.campuses[0] ? `${school.campuses[0].location.city}${school.campuses[0].location.district}` : '未知';
  };

  // Get school image
  const getSchoolImage = (school: ISchool) => {
    if (school.school_images && school.school_images.length > 0) {
      return school.school_images[0];
    }
    return `https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop`;
  };

  // Get unique academic groups from all schools
  const getAcademicGroups = () => {
    const groups = new Set<string>();
    schools.forEach(school => {
      school.departments.forEach(dept => {
        groups.add(dept.academic_group);
      });
    });
    return Array.from(groups).sort();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>;
  }

  return (
    <>
      {/* Top Navy Header */}
      <header className="navy-header">
        <div className="header-inner">
          <div className="logo">UniHow</div>

          <div className="header-right">
            <button className="icon-btn" aria-label="搜尋">
              <span className="icon magnifier" aria-hidden="true"></span>
            </button>
            <button className="icon-btn" aria-label="選單">
              <span className="icon menu" aria-hidden="true"></span>
            </button>
            <button className="cta-search">搜尋</button>
          </div>
        </div>
      </header>

      {/* Segmented Filters Bar */}
      <section className="segbar-wrap">
        <div className="segbar">
          <div className="seg seg-active seg-left">
            <div className="seg-label">入學方式</div>
            <div className="seg-value">申請</div>
          </div>
          <div className="seg">
            <div className="seg-label">學測成績</div>
            <div className="seg-value compact">國:--　英:--　數A:--　數B:--　自:--　社:--</div>
          </div>
          <div className="seg">
            <div className="seg-label">英聽成績</div>
            <div className="seg-value">A</div>
          </div>
          <div className="seg">
            <div className="seg-label">學群偏好</div>
            <div className="seg-value">二類</div>
          </div>
          <div className="seg seg-right">
            <div className="seg-label">公/私立</div>
            <div className="seg-value">公立</div>
          </div>
        </div>
      </section>

      {/* Action Chips Row */}
      <section className="actions-row">
        <div className="tabs">
          <button className="tab active">選校</button>
          <button className="tab">選系</button>
        </div>
        <div className="actions">
          <button className="chip">匯出表格</button>
          <button className="chip">儲存搜尋結果</button>
          <button className="chip">排序方式: 過篩機率</button>
          <button className="chip ghost">進階搜尋</button>
        </div>
      </section>

      {/* Main Two-Column Content */}
      <main className="content twocol">
        {/* Left Sidebar Filters - NOW FUNCTIONAL */}
        <aside className="sidebar">
          <div className="muted-row">
            <span>篩選結果：{filteredSchools.length} 所學校</span>
            {(selectedRegions.length > 0 || selectedGroups.length > 0) && (
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedRegions([]);
                  setSelectedGroups([]);
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
              {['北北基', '桃竹苗', '宜花東', '中彰投', '雲嘉南', '高屏金'].map(region => (
                <label key={region}>
                  <input 
                    type="checkbox" 
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
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
              {getAcademicGroups().map(group => (
                <label key={group}>
                  <input 
                    type="checkbox" 
                    checked={selectedGroups.includes(group)}
                    onChange={() => toggleGroup(group)}
                  /> {group}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Middle: Result List */}
        <section className="results">
          {filteredSchools.map((school) => (
            <article 
              key={school._id} 
              className={`card horiz ${selectedSchool?._id === school._id ? 'selected' : ''}`}
              onClick={() => setSelectedSchool(school)}
              style={{ 
                cursor: 'pointer',
                border: selectedSchool?._id === school._id ? '2px solid #0F5AA8' : undefined,
                transform: selectedSchool?._id === school._id ? 'translateX(4px)' : undefined,
                transition: 'all 0.2s ease'
              }}
            >
              <div className="thumb">
                <img src={getSchoolImage(school)} alt={`${school.school_name}校園照片`} />
              </div>
              <div className="card-body">
                <div className="card-top">
                  <h3>{school.school_name}</h3>
                  <div className="kv small">可填科系數 <strong>{school.departments.length}</strong></div>
                </div>
                <div className="sub">{getMainLocation(school)}</div>
                <div className="tags">
                  {Array.from(new Set(school.departments.map(d => d.academic_group))).slice(0, 4).map((group, idx) => (
                    <span key={idx} className={`tag ${['blue', 'lime', 'mint', 'pink'][idx % 4]}`}>
                      {group}
                    </span>
                  ))}
                </div>
                <a className="more" href="#" onClick={(e) => e.preventDefault()}>
                  查看詳情 <span className="arr">›</span>
                </a>
              </div>
            </article>
          ))}

          {filteredSchools.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              {selectedRegions.length > 0 || selectedGroups.length > 0 
                ? '沒有符合篩選條件的學校' 
                : '目前沒有學校資料'}
            </div>
          )}
        </section>

        {/* Right: Details Panel */}
        <aside className="detail">
          {selectedSchool ? (
            <>
              <div className="detail-top">
                <img 
                  className="rounded main-hero" 
                  src={getSchoolImage(selectedSchool)} 
                  alt="校園主圖" 
                />
                <img 
                  className="rounded thumb-sm" 
                  src={selectedSchool.school_images[1] || getSchoolImage(selectedSchool)} 
                  alt="校園縮圖" 
                />
                <div className="map-card">
                  <div className="map-pattern" aria-hidden="true"></div>
                  <button className="map-btn">
                    <span>查看地圖</span>
                    <span className="map-icon" aria-hidden="true"></span>
                  </button>
                </div>
              </div>

              <h2 className="uni-title">{selectedSchool.school_name}</h2>
              <div className="meta-links">
                <a href={selectedSchool.school_url || '#'} target="_blank" rel="noopener noreferrer">校務資訊</a>
                <span className="dot"></span>
                <a href="#">傳送</a>
              </div>

              <div className="pill-tabs">
                <button className="pill active">科系列表</button>
                <button className="pill">校園資訊</button>
              </div>

              <div className="detail-bottom">
                <div className="department-list" style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}>
                  {selectedSchool.departments.map((dept, idx) => (
                    <div key={idx} style={{ 
                      padding: '0.75rem',
                      borderBottom: idx < selectedSchool.departments.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                        {dept.department_name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', gap: '0.5rem' }}>
                        <span>{dept.college}</span>
                        <span>•</span>
                        <span className="tag blue" style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                          {dept.academic_group}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="detailed-information">
                  <div className="selection-order">
                    <div className="so-table">
                      <div className="so-head">去年(113)最低通過級分與篩選順序</div>
                      <div className="so-body">
                        <div className="so-row scores">
                          <div className="col">
                            <div className="label">國英數A自</div>
                            <div className="value">--</div>
                          </div>
                          <div className="arrow" aria-hidden="true">→</div>
                          <div className="col">
                            <div className="label">數學A</div>
                            <div className="value">--</div>
                          </div>
                          <div className="arrow" aria-hidden="true">→</div>
                          <div className="col">
                            <div className="label">自然</div>
                            <div className="value">--</div>
                          </div>
                        </div>
                        <hr className="divider" />
                        <div className="so-row placeholder">
                          <div className="col"><div className="value muted">--</div></div>
                          <div className="arrow" aria-hidden="true">→</div>
                          <div className="col"><div className="value muted">--</div></div>
                          <div className="arrow" aria-hidden="true">→</div>
                          <div className="col"><div className="value muted">--</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="data-table">
                    <div className="thead">
                      <div>科目</div>
                      <div>門檻</div>
                      <div>倍率</div>
                    </div>
                    <div className="trow">
                      <div>國文</div><div>--</div><div>--</div>
                    </div>
                    <div className="trow">
                      <div>英文</div><div>--</div><div>--</div>
                    </div>
                    <div className="trow">
                      <div>數學A</div><div>--</div><div>--</div>
                    </div>
                    <div className="trow">
                      <div>自然</div><div>--</div><div>--</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="foot-note">
                Collegeo ➜ <a href="#">查看全部</a>
              </div>

              <div className="small-note">
                去年(113)最低通過分與篩選順序
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
              請選擇一所學校查看詳情
            </div>
          )}
        </aside>
      </main>
    </>
  );
}
