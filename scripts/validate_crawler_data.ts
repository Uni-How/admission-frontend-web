import fs from 'fs';
import path from 'path';

/**
 * 資料驗證工具 - 檢查爬蟲資料是否符合標準 JSON 規格
 * 
 * 使用方式:
 * npx tsx scripts/validate_crawler_data.ts JSON/school_data_structured_test1.json
 */

interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  actual?: any;
  expected?: string;
}

interface ValidationReport {
  totalSchools: number;
  totalDepartments: number;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

class DataValidator {
  private issues: ValidationIssue[] = [];
  private stats = {
    schools: 0,
    departments: 0,
    emptyFields: 0,
    typeIssues: 0
  };

  validate(data: any[], standard: any): ValidationReport {
    if (!Array.isArray(data)) {
      this.addIssue('error', 'root', 'Data must be an array of schools');
      return this.generateReport();
    }

    data.forEach((school, schoolIndex) => {
      this.validateSchool(school, schoolIndex);
    });

    return this.generateReport();
  }

  private validateSchool(school: any, index: number) {
    const schoolPath = `schools[${index}]`;
    this.stats.schools++;

    // 必要欄位檢查
    this.checkRequired(school, schoolPath, 'school_id', 'string');
    this.checkRequired(school, schoolPath, 'school_name', 'string');
    this.checkRequired(school, schoolPath, 'school_type', 'string');
    this.checkRequired(school, schoolPath, 'school_url', 'string');

    // 檢查 school_images
    if (!Array.isArray(school.school_images)) {
      this.addIssue('error', `${schoolPath}.school_images`, 'Must be an array');
    } else if (school.school_images.length === 0) {
      this.addIssue('warning', `${schoolPath}.school_images`, 'Empty images array');
      this.stats.emptyFields++;
    }

    // 檢查 campuses
    if (!Array.isArray(school.campuses)) {
      this.addIssue('error', `${schoolPath}.campuses`, 'Must be an array');
    } else if (school.campuses.length === 0) {
      this.addIssue('error', `${schoolPath}.campuses`, 'At least one campus required');
    } else {
      school.campuses.forEach((campus: any, cIdx: number) => {
        this.validateCampus(campus, `${schoolPath}.campuses[${cIdx}]`);
      });

      // 檢查是否有主校區
      const hasMain = school.campuses.some((c: any) => c.is_main === true);
      if (!hasMain) {
        this.addIssue('warning', `${schoolPath}.campuses`, 'No main campus marked');
      }
    }

    // 檢查 departments
    if (!Array.isArray(school.departments)) {
      this.addIssue('error', `${schoolPath}.departments`, 'Must be an array');
    } else if (school.departments.length === 0) {
      this.addIssue('warning', `${schoolPath}.departments`, 'No departments found');
    } else {
      school.departments.forEach((dept: any, dIdx: number) => {
        this.validateDepartment(dept, `${schoolPath}.departments[${dIdx}]`, school);
      });
    }
  }

  private validateCampus(campus: any, path: string) {
    this.checkRequired(campus, path, 'campus_id', 'string');
    this.checkRequired(campus, path, 'campus_name', 'string');
    this.checkRequired(campus, path, 'is_main', 'boolean');

    // Location check
    if (!campus.location || typeof campus.location !== 'object') {
      this.addIssue('error', `${path}.location`, 'Location object required');
    } else {
      this.checkRequired(campus.location, `${path}.location`, 'city', 'string');
      this.checkRequired(campus.location, `${path}.location`, 'district', 'string');
      this.checkRequired(campus.location, `${path}.location`, 'address', 'string');
    }
  }

  private validateDepartment(dept: any, path: string, school: any) {
    this.stats.departments++;

    this.checkRequired(dept, path, 'department_id', 'string');
    this.checkRequired(dept, path, 'department_name', 'string');
    
    // college 空值檢查
    if (!dept.college || dept.college === '') {
      this.addIssue('warning', `${path}.college`, 'College is empty', dept.college, 'Non-empty string');
      this.stats.emptyFields++;
    }

    // campus_ids 驗證
    if (!Array.isArray(dept.campus_ids)) {
      this.addIssue('error', `${path}.campus_ids`, 'Must be an array');
    } else {
      dept.campus_ids.forEach((cid: string) => {
        const exists = school.campuses?.some((c: any) => c.campus_id === cid);
        if (!exists) {
          this.addIssue('error', `${path}.campus_ids`, `Campus ID "${cid}" not found in school.campuses`);
        }
      });
    }

    // years_of_study
    this.checkType(dept.years_of_study, path, 'years_of_study', 'number');

    // admission_data
    if (!dept.admission_data || typeof dept.admission_data !== 'object') {
      this.addIssue('error', `${path}.admission_data`, 'Admission data object required');
    } else {
      Object.keys(dept.admission_data).forEach(year => {
        this.validateAdmissionYear(dept.admission_data[year], `${path}.admission_data.${year}`, year);
      });
    }
  }

  private validateAdmissionYear(data: any, path: string, year: string) {
    if (!data.plans || typeof data.plans !== 'object') {
      this.addIssue('error', `${path}.plans`, 'Plans object required');
      return;
    }

    // Validate each plan type
    ['personal_application', 'distribution_admission', 'star_plan'].forEach(planType => {
      if (data.plans[planType]) {
        this.validatePlan(data.plans[planType], `${path}.plans.${planType}`, planType);
      }
    });

    // Check for last_year_pass_data structure duplication
    if (data.last_year_pass_data && data.plans.personal_application?.last_year_pass_data) {
      this.addIssue('warning', path, 'last_year_pass_data exists in both year level and plan level');
    }
  }

  private validatePlan(plan: any, path: string, planType: string) {
    // quota 型別檢查
    if (plan.quota !== undefined && plan.quota !== null && plan.quota !== '') {
      if (typeof plan.quota === 'string') {
        this.addIssue('warning', `${path}.quota`, 'Quota should be number, not string', plan.quota, 'number');
        this.stats.typeIssues++;
      }
    }

    // exam_thresholds
    if (plan.exam_thresholds !== undefined) {
      if (typeof plan.exam_thresholds === 'string') {
        this.addIssue('error', `${path}.exam_thresholds`, 'Should be array, not string', plan.exam_thresholds);
        this.stats.typeIssues++;
      } else if (!Array.isArray(plan.exam_thresholds))  {
        this.addIssue('error', `${path}.exam_thresholds`, 'Must be array');
      }
    }

    // selection_multipliers
    if (plan.selection_multipliers !== undefined) {
      if (typeof plan.selection_multipliers === 'string') {
        this.addIssue('error', `${path}.selection_multipliers`, 'Should be array, not string', plan.selection_multipliers);
        this.stats.typeIssues++;
      } else if (!Array.isArray(plan.selection_multipliers)) {
        this.addIssue('error', `${path}.selection_multipliers`, 'Must be array');
      }
    }

    // scoring_weights 驗證
    if (plan.scoring_weights && Array.isArray(plan.scoring_weights)) {
      plan.scoring_weights.forEach((weight: any, idx: number) => {
        // 檢查是否缺少 source_type
        if (!weight.source_type) {
          this.addIssue('warning', `${path}.scoring_weights[${idx}]`, 'Missing source_type field (should be "學測" or "分科")');
        }
      });
    }
  }

  private checkRequired(obj: any, path: string, field: string, expectedType: string) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      this.addIssue('error', `${path}.${field}`, `Required field missing`);
    } else {
      this.checkType(obj[field], path, field, expectedType);
    }
  }

  private checkType(value: any, path: string, field: string, expectedType: string) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== expectedType) {
      this.addIssue('warning', `${path}.${field}`, `Type mismatch`, actualType, expectedType);
    }
  }

  private addIssue(severity: 'error' | 'warning' | 'info', path: string, message: string, actual?: any, expected?: string) {
    this.issues.push({ severity, path, message, actual, expected });
  }

  private generateReport(): ValidationReport {
    const summary = {
      errors: this.issues.filter(i => i.severity === 'error').length,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length
    };

    return {
      totalSchools: this.stats.schools,
      totalDepartments: this.stats.departments,
      issues: this.issues,
      summary
    };
  }
}

// 生成人類易讀報告
function generateHumanReadableReport(report: ValidationReport, outputFile: string) {
  const lines: string[] = [];
  
  lines.push('# 大學資料驗證報告');
  lines.push('');
  lines.push(`生成時間: ${new Date().toLocaleString('zh-TW')}`);
  lines.push('');
  
  lines.push('## 📊 總覽');
  lines.push('');
  lines.push(`- **學校數量**: ${report.totalSchools}`);
  lines.push(`- **系所數量**: ${report.totalDepartments}`);
  lines.push(`- **錯誤數量**: ${report.summary.errors} ⛔`);
  lines.push(`- **警告數量**: ${report.summary.warnings} ⚠️`);
  lines.push(`- **資訊數量**: ${report.summary.info} ℹ️`);
  lines.push('');
  
  if (report.summary.errors === 0 && report.summary.warnings === 0) {
    lines.push('## ✅ 驗證通過');
    lines.push('');
    lines.push('所有資料符合標準格式！');
  } else {
    // 按嚴重程度分組
    const errors = report.issues.filter(i => i.severity === 'error');
    const warnings = report.issues.filter(i => i.severity === 'warning');
    const info = report.issues.filter(i => i.severity === 'info');
    
    if (errors.length > 0) {
      lines.push('## ⛔ 錯誤 (必須修正)');
      lines.push('');
      errors.forEach((issue, idx) => {
        lines.push(`### ${idx + 1}. ${issue.path}`);
        lines.push(`- **問題**: ${issue.message}`);
        if (issue.actual !== undefined) {
          lines.push(`- **實際值**: \`${JSON.stringify(issue.actual)}\``);
        }
        if (issue.expected) {
          lines.push(`- **預期型別**: \`${issue.expected}\``);
        }
        lines.push('');
      });
    }
    
    if (warnings.length > 0) {
      lines.push('## ⚠️ 警告 (建議修正)');
      lines.push('');
      
      // 分類警告
      const collegeEmpty = warnings.filter(w => w.path.includes('.college'));
      const typeIssues = warnings.filter(w => w.message.includes('Type mismatch') || w.message.includes('should be'));
      const emptyArrays = warnings.filter(w => w.message.includes('Empty') || w.message.includes('No'));
      const others = warnings.filter(w => !collegeEmpty.includes(w) && !typeIssues.includes(w) && !emptyArrays.includes(w));
      
      if (collegeEmpty.length > 0) {
        lines.push(`### 學院欄位空值 (共 ${collegeEmpty.length} 筆)`);
        lines.push('');
        collegeEmpty.slice(0, 5).forEach(issue => {
          lines.push(`- ${issue.path}`);
        });
        if (collegeEmpty.length > 5) {
          lines.push(`- ... 以及 ${collegeEmpty.length - 5} 筆其他資料`);
        }
        lines.push('');
      }
      
      if (typeIssues.length > 0) {
        lines.push(`### 型別問題 (共 ${typeIssues.length} 筆)`);
        lines.push('');
        const grouped: { [key: string]: ValidationIssue[] } = {};
        typeIssues.forEach(issue => {
          const key = issue.message;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(issue);
        });
        
        Object.entries(grouped).forEach(([msg, issues]) => {
          lines.push(`#### ${msg} (${issues.length} 筆)`);
          issues.slice(0, 3).forEach(issue => {
            lines.push(`- ${issue.path}: \`${JSON.stringify(issue.actual)}\` → \`${issue.expected}\``);
          });
          if (issues.length > 3) {
            lines.push(`- ... 以及 ${issues.length - 3} 筆類似問題`);
          }
          lines.push('');
        });
      }
      
      if (emptyArrays.length > 0) {
        lines.push(`### 空值/缺失資料 (共 ${emptyArrays.length} 筆)`);
        lines.push('');
        emptyArrays.slice(0, 5).forEach(issue => {
          lines.push(`- ${issue.path}: ${issue.message}`);
        });
        if (emptyArrays.length > 5) {
          lines.push(`- ... 以及 ${emptyArrays.length - 5} 筆其他資料`);
        }
        lines.push('');
      }
      
      if (others.length > 0) {
        lines.push(`### 其他警告 (共 ${others.length} 筆)`);
        lines.push('');
        others.slice(0, 5).forEach(issue => {
          lines.push(`- ${issue.path}: ${issue.message}`);
        });
        if (others.length > 5) {
          lines.push(`- ... 以及 ${others.length - 5} 筆其他資料`);
        }
        lines.push('');
      }
    }
  }
  
  lines.push('---');
  lines.push('');
  lines.push('> 此報告由資料驗證工具自動生成');
  
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');
  console.log(`✅ 報告已生成: ${outputFile}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('使用方式: npx tsx scripts/validate_crawler_data.ts <crawler_data.json>');
    console.error('範例: npx tsx scripts/validate_crawler_data.ts JSON/school_data_structured_test1.json');
    process.exit(1);
  }
  
  const crawlerDataPath = path.resolve(args[0]);
  const standardPath = path.resolve('JSON/standard.json');
  
  if (!fs.existsSync(crawlerDataPath)) {
    console.error(`❌ 找不到檔案: ${crawlerDataPath}`);
    process.exit(1);
  }
  
  console.log(`📖 讀取爬蟲資料: ${crawlerDataPath}`);
  const crawlerData = JSON.parse(fs.readFileSync(crawlerDataPath, 'utf-8'));
  
  let standardData;
  if (fs.existsSync(standardPath)) {
    console.log(`📖 讀取標準格式: ${standardPath}`);
    standardData = JSON.parse(fs.readFileSync(standardPath, 'utf-8'));
  }
  
  console.log('🔍 開始驗證資料...');
  const validator = new DataValidator();
  const report = validator.validate(crawlerData, standardData);
  
  console.log('');
  console.log('='.repeat(50));
  console.log('驗證結果:');
  console.log('='.repeat(50));
  console.log(`✅ 學校數量: ${report.totalSchools}`);
  console.log(`✅ 系所數量: ${report.totalDepartments}`);
  console.log(`⛔ 錯誤: ${report.summary.errors}`);
  console.log(`⚠️  警告: ${report.summary.warnings}`);
  console.log(`ℹ️  資訊: ${report.summary.info}`);
  console.log('='.repeat(50));
  
  // 生成報告
  const reportPath = crawlerDataPath.replace(/\.json$/, '_validation_report.md');
  generateHumanReadableReport(report, reportPath);
  
  // 生成 JSON 報告
  const jsonReportPath = crawlerDataPath.replace(/\.json$/, '_validation_report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`✅ JSON 報告已生成: ${jsonReportPath}`);
  
  if (report.summary.errors > 0) {
    console.log('');
    console.log('❌ 驗證失敗: 發現必須修正的錯誤');
    process.exit(1);
  } else if (report.summary.warnings > 0) {
    console.log('');
    console.log('⚠️  驗證通過但有警告: 建議檢查並修正');
  } else {
    console.log('');
    console.log('✅ 驗證完全通過!');
  }
}

main().catch(error => {
  console.error('執行錯誤:', error);
  process.exit(1);
});
