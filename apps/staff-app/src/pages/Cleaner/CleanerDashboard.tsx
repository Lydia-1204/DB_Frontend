import React, { useState, useEffect, FormEvent } from 'react';
import type { StaffInfo, DisinfectionRecord } from '@smart-elderly-care/types'; 
import styles from './CleanerDashboard.module.css';

const POST_API_URL = '/api-staff/staff-info/disinfection/record';
const GET_RECORDS_API_URL = '/api-staff/staff-info/disinfection/records';

export function CleanerDashboard() {
  // ... 其他 state 声明保持不变 ...
  const [area, setArea] = useState('');
  const [methods, setMethods] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [records, setRecords] = useState<DisinfectionRecord[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);


  const getLoggedInUser = (): StaffInfo | null => {
    const userString = localStorage.getItem('loggedInUser');
    return userString ? JSON.parse(userString) : null;
  };

  const fetchRecords = async (staffId: number) => {
    setIsListLoading(true);
    try {
      const response = await fetch(GET_RECORDS_API_URL);
      if (!response.ok) {
        throw new Error(`获取记录失败，服务器状态: ${response.status}`);
      }
      const allRecords: DisinfectionRecord[] = await response.json();
      const userRecords = allRecords.filter(record => record.staffId === staffId);
      
      // 按时间倒序排序，让最新的记录显示在最上面
      userRecords.sort((a, b) => new Date(b.disinfectionTime).getTime() - new Date(a.disinfectionTime).getTime());
      
      setRecords(userRecords);
    } catch (err: any) {
      console.error("获取历史记录失败", err);
      setError('无法加载历史记录，请稍后重试。');
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

  // 【核心修改点】更新 handleSubmit 函数
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

     const newRecordData = {
      area,
      methods,
      staffId: user.staffId,
      // 【修改点】在这里重新加上 disinfectionTime
      disinfectionTime: new Date().toISOString(), // toISOString() 生成标准格式 '2025-08-09T02:14:16.808Z'
    };

    setIsSubmitting(true);
    try {
      // 步骤 1: 发送 POST 请求提交新记录
      const response = await fetch(POST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecordData),
      });

      if (!response.ok) {
        throw new Error(`提交失败，服务器状态: ${response.status}`);
      }
      
      // 步骤 2: 提交成功后的操作
      setSuccessMessage('清洁记录提交成功！');
      setArea('');    // 清空输入框
      setMethods(''); // 清空输入框
      
      // 步骤 3: 重新调用 fetchRecords 函数，从服务器获取包含最新记录的完整列表
      await fetchRecords(user.staffId);

    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ... JSX 渲染部分保持不变 ...
  return (
    <div className={styles.container}>
      {/* 欢迎语 */}
      <div className={styles.welcomeHeader}>
        <h1>{getLoggedInUser() ? `${getLoggedInUser()!.name}，欢迎回来！` : '清洁工工作台'}</h1>
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
            {records.map((record) => (
              <li key={record.disinfectionId} className={styles.recordItem}>
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