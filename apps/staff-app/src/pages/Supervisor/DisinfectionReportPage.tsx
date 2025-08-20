import React, { useState, FormEvent } from 'react';
import type { DisinfectionReportData } from '@smart-elderly-care/types';
import styles from './NursingPlanPage.module.css'; // 复用护理计划页面的样式以保持一致

export function DisinfectionReportPage() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  
  const [reportData, setReportData] = useState<DisinfectionReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch('/api-staff/staff-info/disinfection/report', {
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
      setError(err.message);
    } finally {
      setIsLoading(false);
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
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? '生成中...' : '生成报告'}
        </button>
      </form>

      <div className={styles.reportResultArea}>
        {isLoading && <p>正在生成报告，请稍候...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {reportData && (
          <div className={styles.reportContainer}>
            <h2>{reportData.month} 消毒报告总览</h2>
            <div className={styles.reportSummary}>
                <strong>总消毒次数: {reportData.totalDisinfections} 次</strong>
            </div>
            <div className={styles.reportGrid}>
              {renderDetails('按区域统计', reportData.byArea)}
              {renderDetails('按员工统计', reportData.byStaff)}
              {renderDetails('按方法统计', reportData.byMethod)}
            </div>
          </div>
        )}
        {!isLoading && !reportData && !error && (
            <p className={styles.prompt}>请输入年份和月份以生成报告。</p>
        )}
      </div>
    </div>
  );
}