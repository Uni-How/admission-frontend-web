'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

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

interface SchoolDetailProps {
  school: ISchool | null;
  selectedYear: '114' | '115';
  selectedDeptIndex: number;
}

export default function SchoolDetail({ school, selectedYear, selectedDeptIndex }: SchoolDetailProps) {
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'personal_application';

  const planData = useMemo(() => {
    if (!school) return null;
    const selectedDept = school.departments[selectedDeptIndex];
    const admissionData = selectedDept?.admission_data?.[selectedYear];
    return admissionData?.plans?.[method];
  }, [school, selectedDeptIndex, selectedYear, method]);

  const selectedDept = school?.departments[selectedDeptIndex];

  if (!school) {
    return (
      <aside className="detail">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          請選擇一所學校查看詳情
        </div>
      </aside>
    );
  }

  const getSchoolImage = (school: ISchool) => {
    if (school.school_images && school.school_images.length > 0) {
      return school.school_images[0];
    }
    return `https://placehold.co/800x400/e0e0e0/666?text=${encodeURIComponent(school.school_name)}`;
  };

  return (
    <aside className="detail">
      <div className="detail-top">
        <img className="rounded main-hero" src={getSchoolImage(school)} alt="校園主圖" loading="lazy" />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333' }}>{school.school_name}</div>
        {selectedDept && (
          <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0F5AA8', marginTop: '0.25rem' }}>{selectedDept.department_name}</div>
        )}
        {selectedDept && (
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{selectedDept.college}</span>
            <span>•</span>
            <span className="tag blue" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>{selectedDept.academic_group || '其他'}</span>
          </div>
        )}
      </div>

      <div className="meta-links" style={{ marginBottom: '0.75rem' }}>
        <a href={school.school_url || '#'} target="_blank" rel="noopener noreferrer">校務資訊</a>
      </div>

      <div className="detail-data">
        {/* 去年錄取結果 (分發入學專用) */}
        {method === 'distribution_admission' && planData?.last_year_pass_data ? (
          <div className="selection-order">
            <div className="so-table">
              <div className="so-head">
                去年({selectedYear === '115' ? '114' : '113'})錄取結果
                {planData.last_year_pass_data.weighting_changed && (
                  <span style={{ 
                    marginLeft: '0.5rem', 
                    fontSize: '0.7rem', 
                    color: '#d32f2f',
                    backgroundColor: '#ffebee',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '3px',
                    fontWeight: 500
                  }}>
                    ⚠️ 採計權重已變更
                  </span>
                )}
              </div>
              <div className="so-body">
                <div className="so-row" style={{ display: 'block', padding: '0.75rem' }}>
                  {/* 錄取人數 */}
                  {planData.last_year_pass_data.admission_count != null && (
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>實際錄取人數：</span>
                      <span style={{ fontWeight: 600, color: '#1976d2', fontSize: '1rem' }}>
                        {planData.last_year_pass_data.admission_count} 人
                      </span>
                    </div>
                  )}
                  
                  {/* 最低錄取分數 */}
                  {planData.last_year_pass_data.min_score != null && (
                    <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>最低錄取分數：</span>
                      <span style={{ fontWeight: 700, color: '#d32f2f', fontSize: '1.1rem' }}>
                        {planData.last_year_pass_data.min_score} 分
                      </span>
                    </div>
                  )}
                  
                  {/* 同分參酌 */}
                  {planData.last_year_pass_data.tie_breaker && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>同分參酌：</div>
                      <div style={{ 
                        fontSize: '0.85rem', 
                        color: '#7b1fa2',
                        backgroundColor: '#f3e5f5',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {planData.last_year_pass_data.tie_breaker}
                      </div>
                    </div>
                  )}
                  
                  {/* 特殊身份加分 */}
                  {planData.last_year_pass_data.special_scores && (
                    Object.entries(planData.last_year_pass_data.special_scores).some(([_, score]) => score != null) && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e0e0e0' }}>
                        <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>特殊身份最低分數：</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
                          {planData.last_year_pass_data.special_scores.indigenous != null && (
                            <div>
                              <span style={{ color: '#888' }}>原住民：</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem' }}>
                                {planData.last_year_pass_data.special_scores.indigenous}
                              </span>
                            </div>
                          )}
                          {planData.last_year_pass_data.special_scores.veteran != null && (
                            <div>
                              <span style={{ color: '#888' }}>退伍軍人：</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem' }}>
                                {planData.last_year_pass_data.special_scores.veteran}
                              </span>
                            </div>
                          )}
                          {planData.last_year_pass_data.special_scores.expatriate != null && (
                            <div>
                              <span style={{ color: '#888' }}>僑生：</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem' }}>
                                {planData.last_year_pass_data.special_scores.expatriate}
                              </span>
                            </div>
                          )}
                          {planData.last_year_pass_data.special_scores.mongolian_tibetan != null && (
                            <div>
                              <span style={{ color: '#888' }}>蒙藏生：</span>
                              <span style={{ fontWeight: 600, marginLeft: '0.25rem' }}>
                                {planData.last_year_pass_data.special_scores.mongolian_tibetan}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* 權重變更警告 */}
                  {planData.last_year_pass_data.weighting_changed && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      padding: '0.5rem',
                      backgroundColor: '#fff3e0',
                      borderLeft: '3px solid #f57c00',
                      fontSize: '0.75rem',
                      color: '#e65100'
                    }}>
                      ⚠️ 注意：此系組的採計權重在114與115學年度間有所變動，上述分數是基於114學年度的採計方式計算。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : method === 'distribution_admission' ? (
          <div className="selection-order">
            <div className="so-table">
              <div className="so-head">去年({selectedYear === '115' ? '114' : '113'})錄取結果</div>
              <div className="so-body">
                <div className="so-row placeholder"><div className="col"><div className="value muted">資料尚未提供</div></div></div>
              </div>
            </div>
          </div>
        ) : null}

        {/* 🔒 檢定標準（門檻）- 必須先通過才能進入採計 */}
        {planData?.exam_thresholds && planData.exam_thresholds.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#d32f2f', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span>🔒</span>
              <span>檢定標準（門檻）</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              marginBottom: '0.5rem',
              fontStyle: 'italic'
            }}>
              ※ 必須通過以下門檻才能進入成績採計
            </div>
            <div className="data-table">
              <div className="thead">
                <div>科目</div>
                <div>門檻</div>
              </div>
              {(() => {
                const groupedThresholds: { [key: number]: typeof planData.exam_thresholds } = {};
                planData.exam_thresholds.forEach((threshold: any) => {
                  const groupId = threshold.group ?? 1;
                  if (!groupedThresholds[groupId]) {
                    groupedThresholds[groupId] = [];
                  }
                  groupedThresholds[groupId].push(threshold);
                });

                const sortedGroups = Object.keys(groupedThresholds)
                  .map(Number)
                  .sort((a, b) => a - b);

                return (
                  <>
                    {sortedGroups.map((groupId, groupIdx) => {
                      const groupItems = groupedThresholds[groupId];
                      return (
                        <div key={groupId}>
                          {groupIdx > 0 && (
                            <div className="trow" style={{ 
                              textAlign: 'center', 
                              color: '#d32f2f', 
                              fontWeight: 600, 
                              fontSize: '0.85rem',
                              backgroundColor: '#ffebee'
                            }}>
                              <div style={{ gridColumn: '1 / -1' }}>且 (AND)</div>
                            </div>
                          )}
                          {groupItems.map((threshold: any, idx: number) => (
                            <div key={`${groupId}-${idx}`} className="trow">
                              <div>{threshold.subject}</div>
                              <div>{threshold.threshold || '--'}</div>
                            </div>
                          ))}
                          {groupItems.length > 1 && (
                            <div className="trow" style={{ 
                              textAlign: 'center', 
                              color: '#999', 
                              fontSize: '0.75rem', 
                              fontStyle: 'italic',
                              backgroundColor: '#f5f5f5'
                            }}>
                              <div style={{ gridColumn: '1 / -1' }}>↑ 以上擇一 (OR)</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* 📊 採計科目與倍率（分科入學專用） */}
        {method === 'distribution_admission' && planData?.scoring_weights && planData.scoring_weights.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#1976d2', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span>📊</span>
              <span>採計科目與倍率 (115學年度)</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              marginBottom: '0.5rem',
              fontStyle: 'italic'
            }}>
              ※ 通過門檻後，依以下科目加權計算總分
            </div>
            <div className="data-table">
              <div className="thead">
                <div>科目</div>
                <div>來源</div>
                <div>倍率</div>
              </div>
              {(() => {
                // 按 tie_breakers 的順序排列採計科目
                const tieBreakers = planData.tie_breakers || [];
                const sortedWeights = planData.scoring_weights.slice().sort((a: any, b: any) => {
                  const aIndex = tieBreakers.indexOf(a.subject);
                  const bIndex = tieBreakers.indexOf(b.subject);
                  // 如果在 tie_breakers 中，按其順序排列；否則放在最後
                  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                  if (aIndex !== -1) return -1;
                  if (bIndex !== -1) return 1;
                  return 0;
                });
                return sortedWeights.map((weight: any, idx: number) => (
                  <div key={idx} className="trow">
                    <div>{weight.subject}</div>
                    <div>
                      <span style={{ 
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                        backgroundColor: weight.source_type === '學測' ? '#e3f2fd' : '#fff3e0',
                        color: weight.source_type === '學測' ? '#1976d2' : '#f57c00',
                        fontWeight: 500
                      }}>
                        {weight.source_type || '學測/分科'}
                      </span>
                    </div>
                    <div>x{weight.multiplier || 1}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* 📊 去年採計科目與倍率 (114學年度 - 僅在權重變更時顯示) */}
        {method === 'distribution_admission' && 
         planData?.last_year_pass_data?.weighting_changed && 
         planData?.last_year_pass_data?.scoring_weights_114 && 
         planData.last_year_pass_data.scoring_weights_114.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#f57c00', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span>📊</span>
              <span>去年採計科目與倍率 (114學年度)</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#e65100', 
              marginBottom: '0.5rem',
              fontStyle: 'italic'
            }}>
              ⚠️ 114學年度使用的採計方式與115不同，僅供參考
            </div>
            <div className="data-table">
              <div className="thead">
                <div>科目</div>
                <div>來源</div>
                <div>倍率</div>
              </div>
              {(() => {
                // 114 學年度也按 tie_breakers 的順序排列（使用相同順序邏輯）
                const tieBreakers = planData.tie_breakers || [];
                const sortedWeights = planData.last_year_pass_data.scoring_weights_114.slice().sort((a: any, b: any) => {
                  const aIndex = tieBreakers.indexOf(a.subject);
                  const bIndex = tieBreakers.indexOf(b.subject);
                  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                  if (aIndex !== -1) return -1;
                  if (bIndex !== -1) return 1;
                  return 0;
                });
                return sortedWeights.map((weight: any, idx: number) => (
                  <div key={idx} className="trow" style={{ backgroundColor: '#fff3e0' }}>
                    <div>{weight.subject}</div>
                    <div>
                      <span style={{ 
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                        backgroundColor: weight.source_type === '學測' ? '#e3f2fd' : '#ffe0b2',
                        color: weight.source_type === '學測' ? '#1976d2' : '#e65100',
                        fontWeight: 500
                      }}>
                        {weight.source_type || '學測/分科'}
                      </span>
                    </div>
                    <div>x{weight.multiplier || 1}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ⚖️ 同分比序（分科入學專用） */}
        {method === 'distribution_admission' && planData?.tie_breakers && planData.tie_breakers.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#7b1fa2', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span>⚖️</span>
              <span>同分比序</span>
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#666', 
              marginBottom: '0.5rem',
              fontStyle: 'italic'
            }}>
              ※ 加權總分相同時，依序比較以下科目
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem',
              backgroundColor: '#f3e5f5',
              borderRadius: '6px',
              flexWrap: 'wrap'
            }}>
              {planData.tie_breakers.map((subject: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#7b1fa2',
                    backgroundColor: 'white',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    border: '1px solid #ce93d8'
                  }}>
                    {idx + 1}. {subject}
                  </span>
                  {idx < planData.tie_breakers.length - 1 && (
                    <span style={{ color: '#999', fontSize: '0.9rem' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📐 篩選倍率（個人申請專用） */}
        {method === 'personal_application' && planData?.selection_multipliers && planData.selection_multipliers.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: '#1976d2', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <span>📐</span>
              <span>篩選倍率</span>
            </div>
            <div className="data-table">
              <div className="thead">
                <div>科目</div>
                <div>倍率</div>
              </div>
              {planData.selection_multipliers.map((multiplier: any, idx: number) => (
                <div key={idx} className="trow">
                  <div>{multiplier.subject}</div>
                  <div>x{multiplier.multiplier || 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
