import React, { useState, useEffect, FormEvent } from 'react';
import type { Activity, StaffInfo, ApiResponse } from '@smart-elderly-care/types';
import styles from './ElderlyManagementPage.module.css';

// Interface for the activity participation data
interface ActivityParticipant {
  participation_id: number;
  activity_id: number;
  elderly_id: number;
  elderly_name: string;
  status: string;
  registration_time: string;
  check_in_time: string | null;
}

export function ActivitySchedulePage() {
  // --- State Management ---
  const [staffActivities, setStaffActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_name: '',
    location: '',
    activity_date: '',
    activity_time: '',
    activity_description: '',
  });

  // Sign-In Modal State
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [signInElderlyId, setSignInElderlyId] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // View Participants Modal State
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    const userString = localStorage.getItem('loggedInUser');
    if (!userString) {
      setError('无法获取当前用户信息，请重新登录');
      setIsLoading(false);
      return;
    }
    const currentUser: StaffInfo = JSON.parse(userString);

    try {
      const fromDate = '2020-01-01T00:00:00';
      const toDate = '2030-01-01T00:00:00';
      const url = `/api/Activity?from=${fromDate}&to=${toDate}&page=1&pageSize=100`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('获取活动列表失败');

      const responseData: ApiResponse<Activity[]> = await response.json();

      if (responseData && responseData.data) {
        const allActivities = responseData.data;
        const filtered = allActivities.filter(act => act.staff_id === currentUser.staffId);
        setStaffActivities(filtered);
      } else {
        throw new Error('后端返回的数据格式不正确');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipants = async (activityId: number) => {
    setIsLoadingParticipants(true);
    setParticipantsError(null);
    try {
      const response = await fetch(`/api/ActivityParticipation/by-activity/${activityId}`);
      if (!response.ok) {
        throw new Error(`获取报名列表失败: 状态码 ${response.status}`);
      }
      const data: ActivityParticipant[] = await response.json();
      setParticipants(data);
    } catch (err: any) {
      setParticipantsError(err.message);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // --- Event Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const userString = localStorage.getItem('loggedInUser');
    if (!userString) {
      setError('用户信息丢失，请重新登录');
      setIsSubmitting(false);
      return;
    }
    const currentUser: StaffInfo = JSON.parse(userString);

    const activityData = {
      ...newActivity,
      activity_date: new Date(newActivity.activity_date).toISOString(),
      activity_time: `${newActivity.activity_time}:00`,
      staff_id: currentUser.staffId,
    };

    try {
      const response = await fetch('/api/Activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`创建活动失败: ${errorText}`);
      }

      setIsCreateModalOpen(false);
      setNewActivity({ activity_name: '', location: '', activity_date: '', activity_time: '', activity_description: '' });
      fetchActivities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSignInModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setSignInElderlyId('');
    setSignInError(null);
    setIsSignInModalOpen(true);
  };

  const openParticipantsModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsParticipantsModalOpen(true);
    fetchParticipants(activity.activity_id);
  };

  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInElderlyId || !selectedActivity) return;

    setIsSigningIn(true);
    setSignInError(null);

    const signInData = {
      activity_id: selectedActivity.activity_id,
      elderly_id: Number(signInElderlyId),
    };

    try {
      const response = await fetch('/api/ActivityParticipation/check-in', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`签到失败: ${errorText || `状态码 ${response.status}`}`);
      }

      alert(`ID为 ${signInElderlyId} 的老人已成功签到活动 "${selectedActivity.activity_name}"！`);
      setIsSignInModalOpen(false);
    } catch (err: any) {
      setSignInError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCancelOrDelete = async (activity: Activity) => {
    const actionText = activity.status === '报名中' ? '取消' : '删除';
    if (!window.confirm(`确定要${actionText}活动 "${activity.activity_name}" (ID: ${activity.activity_id}) 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/Activity/${activity.activity_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`${actionText}失败，状态码: ${response.status}`);
      }
      alert(`活动${actionText}成功！`);
      fetchActivities();
    } catch (err: any) {
      setError(`${actionText}活动时出错: ${err.message}`);
    }
  };

  // --- JSX for Modals ---
  const renderCreateModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleCreateSubmit}>
          <h2>创建新活动</h2>
          <div className={styles.formGroup}><label>活动名称</label><input name="activity_name" type="text" value={newActivity.activity_name} onChange={handleInputChange} required /></div>
          <div className={styles.formGroup}><label>活动地点</label><input name="location" type="text" value={newActivity.location} onChange={handleInputChange} required /></div>
          <div className={styles.formGroup}><label>活动日期</label><input name="activity_date" type="date" value={newActivity.activity_date} onChange={handleInputChange} required /></div>
          <div className={styles.formGroup}><label>活动时间</label><input name="activity_time" type="time" value={newActivity.activity_time} onChange={handleInputChange} required /></div>
          <div className={styles.formGroup}><label>活动描述</label><textarea name="activity_description" value={newActivity.activity_description} onChange={handleInputChange} rows={4} style={{width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px'}}/></div>
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsCreateModalOpen(false)}>取消</button>
            <button type="submit" className={styles.button} disabled={isSubmitting}>{isSubmitting ? '创建中...' : '确认创建'}</button>
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
          <p>正在为活动: <strong>{selectedActivity?.activity_name}</strong> (ID: {selectedActivity?.activity_id}) 进行签到</p>
          <div className={styles.formGroup}><label htmlFor="elderlyIdInput">请输入老人ID</label><input id="elderlyIdInput" type="number" value={signInElderlyId} onChange={(e) => setSignInElderlyId(e.target.value)} placeholder="例如: 61" required /></div>
          {signInError && <p className={styles.error}>{signInError}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsSignInModalOpen(false)}>取消</button>
            <button type="submit" className={styles.button} disabled={isSigningIn}>{isSigningIn ? '签到中...' : '确认签到'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderParticipantsModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent} style={{maxWidth: '800px'}}>
        <h2>"{selectedActivity?.activity_name}" 报名情况</h2>
        {isLoadingParticipants ? <p>正在加载报名列表...</p> : participantsError ? <p className={styles.error}>{participantsError}</p> : (
          <>
            {participants.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>老人姓名</th>
                    <th>报名状态</th>
                    <th>报名时间</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map(p => (
                    <tr key={p.participation_id}>
                      <td>{p.elderly_name}</td>
                      <td>{p.status}</td>
                      <td>{new Date(p.registration_time).toLocaleString('zh-CN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{textAlign: 'center', padding: '20px'}}>暂无报名记录。</p>
            )}
          </>
        )}
        <div className={styles.modalActions}>
          <button type="button" className={styles.button} onClick={() => setIsParticipantsModalOpen(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  // --- Main Component Render ---
  return (
    <div className={styles.container}>
      {isCreateModalOpen && renderCreateModal()}
      {isSignInModalOpen && renderSignInModal()}
      {isParticipantsModalOpen && renderParticipantsModal()}

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
              <th>活动日期</th>
              <th>活动时间</th>
              <th>状态</th>
              <th style={{width: '280px'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {staffActivities.length > 0 ? (
              staffActivities.map(act => {
                const canSignIn = act.status === '报名中' || act.status === '进行中';
                const isFinished = act.status === '已结束';
                const isCancelable = act.status === '报名中';

                return (
                  <tr key={act.activity_id}>
                    <td>{act.activity_name}</td>
                    <td>{act.location}</td>
                    <td>{new Date(act.activity_date).toLocaleDateString('zh-CN')}</td>
                    <td>{act.activity_time.split(' ')[1].substring(0, 5)}</td>
                    <td><span style={{ padding: '4px 8px', borderRadius: '4px', color: 'white', backgroundColor: isCancelable ? '#1890ff' : (isFinished ? '#bfbfbf' : '#52c41a') }}>{act.status}</span></td>
                    <td className={styles.actions}>
                      {isCancelable && (
                        <button className={`${styles.button} ${styles.viewBtn}`} onClick={() => openParticipantsModal(act)}>
                          查看报名
                        </button>
                      )}
                      {!isFinished && (
                        <button className={`${styles.button} ${styles.editBtn}`} onClick={() => openSignInModal(act)} disabled={!canSignIn}>签到</button>
                      )}
                      {!isFinished && (
                        <button className={`${styles.button} ${isCancelable ? styles.cancelBtn : styles.deleteBtn}`} onClick={() => handleCancelOrDelete(act)}>
                          {isCancelable ? '取消活动' : '删除活动'}
                        </button>
                      )}
                      {isFinished && (
                        <span style={{ color: '#888', fontStyle: 'italic' }}>活动已结束</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>您当前没有负责的活动。</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}