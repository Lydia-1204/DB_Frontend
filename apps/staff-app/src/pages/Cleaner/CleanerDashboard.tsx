import React, { useState, useEffect, FormEvent } from 'react';
import type { StaffInfo, DisinfectionRecord } from '@smart-elderly-care/types'; // 确保类型包路径正确
import styles from './CleanerDashboard.module.css'; // 我们将为 Dashboard 创建一个专属的样式文件

// API 地址
const API_URL = '/api-staff/staff-info/disinfection/record';

export function CleanerDashboard() {
  // 表单状态
  const [area, setArea] = useState('');
  const [methods, setMethods] = useState('');
  
  // 交互状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 历史记录状态
  const [records, setRecords] = useState<DisinfectionRecord[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);

  // 获取当前登录的用户信息
  const getLoggedInUser = (): StaffInfo | null => {
    const userString = localStorage.getItem('loggedInUser');
    return userString ? JSON.parse(userString) : null;
  };

  // 获取历史记录的函数
  const fetchRecords = async (staffId: number) => {
    try {
      setIsListLoading(true);
      // 注意：这里我们假设有一个 GET 接口来获取指定员工的记录
      // 实际开发中需要后端提供此接口，例如 GET /api/staff-info/disinfection/record/staff/{staffId}
      // 作为演示，我们暂时留空，你可以后续实现
      console.log("获取历史记录功能待后端 API 支持");
      setRecords([]); // 暂时设置为空数组
    } catch (err) {
      console.error("获取历史记录失败", err);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    const user = getLoggedInUser();
    if (user && user.staffId) {
      fetchRecords(user.staffId);
    } else {
      setIsListLoading(false);
    }
  }, []);

  // 表单提交处理函数
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!area.trim() || !methods.trim()) {
      setError('清洁区域和使用方法不能为空！');
      return;
    }

    const user = getLoggedInUser();
    if (!user || !user.staffId) {
      setError('无法获取当前用户信息，请重新登录。');
      return;
    }

    const newRecord = {
      area,
      methods,
      staffId: user.staffId,
      disinfectionTime: new Date().toISOString(), // 自动生成当前时间的 ISO 格式字符串
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) {
        throw new Error(`提交失败，服务器状态: ${response.status}`);
      }
      
      // 提交成功
      setSuccessMessage('清洁记录提交成功！');
      setArea('');
      setMethods('');
      // 刷新列表（将新记录添加到最前面）
      setRecords(prevRecords => [newRecord as DisinfectionRecord, ...prevRecords]);

    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const user = getLoggedInUser();

  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeHeader}>
        <h1>{user ? `${user.name}，欢迎回来！` : '清洁工工作台'}</h1>
        <p>在这里提交您的日常清洁与消毒工作记录。</p>
      </div>

      {/* 提交表单部分 */}
      <div className={styles.card}>
        <h2>提交新记录</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="area">清洁区域</label>
            <input
              id="area"
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="例如：三号楼公共活动室"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="methods">使用方法/消毒剂</label>
            <textarea
              id="methods"
              value={methods}
              onChange={(e) => setMethods(e.target.value)}
              placeholder="例如：使用 84 消毒液进行地面和桌面擦拭"
              rows={4}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {successMessage && <p className={styles.success}>{successMessage}</p>}
          
          <button type="submit" disabled={isSubmitting} className={styles.button}>
            {isSubmitting ? '正在提交...' : '确认提交'}
          </button>
        </form>
      </div>

      {/* 历史记录部分 */}
      <div className={`${styles.card} ${styles.historySection}`}>
        <h2>我的历史提交记录</h2>
        {isListLoading ? (
          <p>正在加载历史记录...</p>
        ) : records.length > 0 ? (
          <ul className={styles.recordList}>
            {records.map((record, index) => (
              <li key={index} className={styles.recordItem}>
                <p><strong>区域:</strong> {record.area}</p>
                <p><strong>方法:</strong> {record.methods}</p>
                <p><strong>时间:</strong> {new Date(record.disinfectionTime).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无历史记录。</p>
        )}
      </div>
    </div>
  );
}