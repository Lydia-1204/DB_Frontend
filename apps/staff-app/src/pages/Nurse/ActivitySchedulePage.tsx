import React, { useState, useEffect, FormEvent } from 'react';
import type { Activity, StaffInfo } from '@smart-elderly-care/types';
// 我们将复用之前页面创建的样式，以保持 UI 风格的统一
import styles from './ElderlyManagementPage.module.css'; 

export function ActivitySchedulePage() {
  // --- State Management ---
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [staffActivities, setStaffActivities] = useState<Activity[]>([]); // 只存放当前员工负责的活动
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activityName: '',
    location: '',
    startTime: '',
  });

  // State for Sign-In Modal
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [signInElderlyId, setSignInElderlyId] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // --- Data Fetching and Filtering ---
  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const userString = localStorage.getItem('loggedInUser');
    if (userString && allActivities.length > 0) {
      const currentUser: StaffInfo = JSON.parse(userString);
      const filtered = allActivities.filter(act => act.staffId === currentUser.staffId);
      setStaffActivities(filtered);
    } else {
      setStaffActivities([]); // 如果没有用户信息或活动，则清空
    }
  }, [allActivities]);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/Activity');
      if (!response.ok) throw new Error('获取活动列表失败');
      const data: Activity[] = await response.json();
      setAllActivities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Event Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setError(null);

    const userString = localStorage.getItem('loggedInUser');
    if (!userString) {
      setError('无法获取当前用户信息，请重新登录');
      setIsSubmittingCreate(false);
      return;
    }
    const currentUser: StaffInfo = JSON.parse(userString);

    // activityId is 0 for creation as per API example
    const activityData = {
      activityId: 0,
      ...newActivity,
      startTime: new Date(newActivity.startTime).toISOString(),
      staffId: currentUser.staffId,
    };

    try {
      const response = await fetch('/api/Activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) throw new Error('创建活动失败');
      
      setIsCreateModalOpen(false);
      setNewActivity({ activityName: '', location: '', startTime: '' }); // Reset form
      fetchActivities(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };
  
  const openSignInModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setSignInElderlyId('');
    setSignInError(null);
    setIsSignInModalOpen(true);
  };
  
  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInElderlyId || !selectedActivity) return;

    setIsSigningIn(true);
    setSignInError(null);
    try {
      const response = await fetch(
        `/api/ActivityParticipation/SignIn?elderlyId=${signInElderlyId}&activityId=${selectedActivity.activityId}`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`签到失败: ${errorText || `状态码 ${response.status}`}`);
      }
      
      alert(`ID为 ${signInElderlyId} 的老人已成功签到活动 "${selectedActivity.activityName}"！`);
      setIsSignInModalOpen(false);
    } catch (err: any) {
      setSignInError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  // --- JSX for Modals ---
  const renderCreateModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleCreateSubmit}>
          <h2>创建新活动</h2>
          <div className={styles.formGroup}>
            <label>活动名称</label>
            <input name="activityName" type="text" value={newActivity.activityName} onChange={handleInputChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>活动地点</label>
            <input name="location" type="text" value={newActivity.location} onChange={handleInputChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>开始时间</label>
            <input name="startTime" type="datetime-local" value={newActivity.startTime} onChange={handleInputChange} required />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsCreateModalOpen(false)}>取消</button>
            <button type="submit" className={styles.button} disabled={isSubmittingCreate}>
              {isSubmittingCreate ? '创建中...' : '确认创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSignInModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSignInSubmit}>
          <h2>活动签到</h2>
          <p>正在为活动: <strong>{selectedActivity?.activityName}</strong> (ID: {selectedActivity?.activityId}) 进行签到</p>
          <div className={styles.formGroup}>
            <label htmlFor="elderlyIdInput">请输入老人ID</label>
            <input 
              id="elderlyIdInput"
              type="number" 
              value={signInElderlyId}
              onChange={(e) => setSignInElderlyId(e.target.value)}
              placeholder="例如: 61"
              required 
            />
          </div>
          {signInError && <p className={styles.error}>{signInError}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsSignInModalOpen(false)}>取消</button>
            <button type="submit" className={styles.button} disabled={isSigningIn}>
              {isSigningIn ? '签到中...' : '确认签到'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // --- Main Component Render ---
  return (
    <div className={styles.container}>
      {isCreateModalOpen && renderCreateModal()}
      {isSignInModalOpen && renderSignInModal()}
      
      <div className={styles.header}>
        <h1>我的活动安排</h1>
        <button className={styles.button} onClick={() => setIsCreateModalOpen(true)}>+ 创建新活动</button>
      </div>
      
      {isLoading ? <p>正在加载活动列表...</p> : error ? <p className={styles.error}>错误: {error}</p> : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>活动名称</th>
              <th>地点</th>
              <th>开始时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {staffActivities.length > 0 ? (
              staffActivities.map(act => (
                <tr key={act.activityId}>
                  <td>{act.activityName}</td>
                  <td>{act.location}</td>
                  <td>{new Date(act.startTime).toLocaleString('zh-CN')}</td>
                  <td>
                    <button 
                      className={`${styles.button} ${styles.editBtn}`}
                      onClick={() => openSignInModal(act)}
                    >
                      签到
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>您当前没有负责的活动。</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}