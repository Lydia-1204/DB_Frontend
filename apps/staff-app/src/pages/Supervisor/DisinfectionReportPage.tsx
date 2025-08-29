import React, { useState, useEffect, FormEvent } from 'react';
import type { DisinfectionRecord, DisinfectionReportData } from '@smart-elderly-care/types';
import styles from './DisinfectionReportPage.module.css';

// API 地址
const GET_RECORDS_API_URL = '/api-staff/staff-info/disinfection/records';
const REPORT_API_URL = '/api-staff/staff-info/disinfection/report';

export function DisinfectionReportPage() {
  // --- 报告生成状态 ---
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [reportData, setReportData] = useState<DisinfectionReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // --- 记录查询功能的状态 ---
  const [allRecords, setAllRecords] = useState<DisinfectionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DisinfectionRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // --- 搜索条件的状态 ---
  const [searchStaffId, setSearchStaffId] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchMonth, setSearchMonth] = useState('');

  // Effect 1: 组件首次加载时，获取所有消毒记录
  useEffect(() => {
    const fetchAllRecords = async () => {
      setIsRecordsLoading(true);
      try {
        const response = await fetch(GET_RECORDS_API_URL);
        if (!response.ok) {
          throw new Error('获取消毒记录列表失败');
        }
        const data: DisinfectionRecord[] = await response.json();
        data.sort((a, b) => new Date(b.disinfectionTime).getTime() - new Date(a.disinfectionTime).getTime());
        setAllRecords(data);
        setFilteredRecords(data);
      } catch (err: any) {
        setRecordsError(err.message);
      } finally {
        setIsRecordsLoading(false);
      }
    };

    fetchAllRecords();
  }, []);

  // Effect 2: 每当搜索条件或原始数据变化时，执行前端筛选
  useEffect(() => {
    let result = allRecords;

    if (searchStaffId.trim()) {
      result = result.filter(record => record.staffId.toString() === searchStaffId.trim());
    }

    if (searchArea.trim()) {
      result = result.filter(record => record.area.toLowerCase().includes(searchArea.trim().toLowerCase()));
    }

    if (searchYear.trim()) {
      result = result.filter(record => {
        const recordYear = new Date(record.disinfectionTime).getFullYear();
        return recordYear.toString() === searchYear.trim();
      });
    }
    
    if (searchMonth) {
      result = result.filter(record => {
        const recordMonth = new Date(record.disinfectionTime).getMonth() + 1;
        return recordMonth.toString() === searchMonth;
      });
    }

    setFilteredRecords(result);
  }, [searchStaffId, searchArea, searchYear, searchMonth, allRecords]);

  // 报告生成函数
  const handleGenerateReport = async (e: FormEvent) => {
    e.preventDefault();
    setIsReportLoading(true);
    setReportError(null);
    setReportData(null);

    try {
      const response = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: parseInt(year, 10),
          month: parseInt(month, 10),
        }),
      });

      if (!response.ok) {
        throw new Error('生成报告失败，请检查输入的年份和月份是否正确。');
      }

      const data: DisinfectionReportData = await response.json();
      setReportData(data);
    } catch (err: any) {
      setReportError(err.message);
    } finally {
      setIsReportLoading(false);
    }
  };

  // 辅助函数，用于渲染报告中的对象数据
  const renderDetails = (title: string, data: Record<string, number>) => (
    <div className={styles.reportCard}>
      <h3>{title}</h3>
      <ul>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}><strong>{key}:</strong> {value} 次</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* --- 报告生成部分 --- */}
      <div className={styles.header}>
        <h1>月度消毒报告</h1>
      </div>

      <form onSubmit={handleGenerateReport} className={styles.reportForm}>
        <div className={styles.formGroup}>
          <label htmlFor="year-input">年份</label>
          <input
            id="year-input"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="例如: 2025"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="month-input">月份</label>
          <input
            id="month-input"
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="例如: 8"
            min="1"
            max="12"
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={isReportLoading}>
          {isReportLoading ? '生成中...' : '生成报告'}
        </button>
      </form>

      {/* --- 报告结果展示部分 --- */}
      <div className={styles.reportResultArea}>
        {isReportLoading && <p>正在生成报告，请稍候...</p>}
        {reportError && <p className={styles.error}>{reportError}</p>}
        {reportData && (
          <div className={styles.reportContainer}>
            <h2>{reportData.month} 消毒报告总览</h2>
            <div className={styles.overviewLayout}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div className={styles.summaryText}>
                  <span>总消毒次数</span>
                  <strong>{reportData.totalDisinfections} 次</strong>
                </div>
              </div>
              <div className={styles.reportGrid}>
                {renderDetails('按区域统计', reportData.byArea)}
                {renderDetails('按员工统计', reportData.byStaff)}
                {renderDetails('按方法统计', reportData.byMethod)}
              </div>
            </div>
          </div>
        )}
        {!isReportLoading && !reportData && !reportError && (
          <p className={styles.prompt}>请输入年份和月份以生成报告。</p>
        )}
      </div>

      {/* --- 分割线 --- */}
      <hr className={styles.divider} />

      {/* --- 记录查询部分 --- */}
      <div className={styles.recordsSection}>
        <h2>消毒记录查询</h2>
        <div className={styles.searchFilters}>
          <input
            type="text"
            placeholder="按员工ID..."
            value={searchStaffId}
            onChange={(e) => setSearchStaffId(e.target.value)}
          />
          <input
            type="text"
            placeholder="按消毒区域搜索..."
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
          />
          <input
            type="number"
            placeholder="按年份..."
            value={searchYear}
            onChange={(e) => setSearchYear(e.target.value)}
          />
          <select value={searchMonth} onChange={(e) => setSearchMonth(e.target.value)}>
            <option value="">所有月份</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}月</option>
            ))}
          </select>
        </div>

        <div className={styles.recordsTableContainer}>
          {isRecordsLoading ? (
            <p>正在加载记录...</p>
          ) : recordsError ? (
            <p className={styles.error}>{recordsError}</p>
          ) : (
            <table className={styles.recordsTable}>
              <thead>
                <tr>
                  <th>记录ID</th>
                  <th>区域</th>
                  <th>方法</th>
                  <th>员工ID</th>
                  <th>消毒时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(record => (
                    <tr key={record.disinfectionId}>
                      <td>{record.disinfectionId}</td>
                      <td>{record.area}</td>
                      <td>{record.methods}</td>
                      <td>{record.staffId}</td>
                      <td>{new Date(record.disinfectionTime).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>没有找到符合条件的记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}