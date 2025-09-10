import React, { useState, useEffect, FormEvent } from 'react';
import type { Activity, StaffInfo, ApiResponse } from '@smart-elderly-care/types';
import styles from './ElderlyManagementPage.module.css'; 

export function ActivitySchedulePage() {
  // --- State Management ---
  const [staffActivities, setStaffActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
    // --- ↓↓↓↓↓↓ 核心修复在这里 ↓↓↓↓↓↓ ---
  // 为 newActivity state 提供一个完整的初始对象，
  // 让 TypeScript 知道它的“形状”。
  const [newActivity, setNewActivity] = useState({
    activity_name: '',
    location: '',
    activity_date: '',
    activity_time: '',
    activity_description: '',
  });
  // --- ↑↑↑↑↑↑ 核心修复在这里 ↑↑↑↑↑↑ ---

  // --- ↓↓↓↓ 新增/修改的签到功能 State ↓↓↓↓ ---
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [signInElderlyId, setSignInElderlyId] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // --- Data Fetching (保持不变) ---
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => { /* ... 之前的代码 ... */ };

  // --- Event Handlers (创建活动部分保持不变) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { /* ... */ };
  const handleCreateSubmit = async (e: FormEvent) => { /* ... */ };

  // --- ↓↓↓↓ 新增/修改的签到和取消逻辑 ↓↓↓↓ ---
  
  // 打开签到模态框的函数
  const openSignInModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setSignInElderlyId(''); // 清空上次输入
    setSignInError(null); // 清空上次错误
    setIsSignInModalOpen(true);
  };
  
  // 处理签到提交的函数
  const handleSignInSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInElderlyId || !selectedActivity) return;

    setIsSigningIn(true);
    setSignInError(null);
    
    const signInData = {
      activity_id: selectedActivity.activity_id,
      elderly_id: Number(signInElderlyId), // 确保是数字类型
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
      setIsSignInModalOpen(false); // 关闭模态框
      // 签到成功后无需刷新整个列表，因为活动本身的状态没有改变
    } catch (err: any) {
      setSignInError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  // 处理删除/取消活动的函数
  const handleCancelOrDelete = async (activity: Activity) => {
    const actionText = activity.status === '报名中' ? '取消' : '删除';
    if (!window.confirm(`确定要${actionText}活动 "${activity.activity_name}" (ID: ${activity.activity_id}) 吗？`)) {
      return;
    }

    // 无论取消还是删除，都调用同一个 DELETE 接口
    try {
      const response = await fetch(`/api/Activity/${activity.activity_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`${actionText}失败，状态码: ${response.status}`);
      }
      alert(`活动${actionText}成功！`);
      fetchActivities(); // 操作成功后刷新列表
    } catch (err: any) {
      setError(`${actionText}活动时出错: ${err.message}`);
    }
  };

// JSX for Create Modal
  const renderCreateModal = () => ( // 使用圆括号进行隐式 return
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleCreateSubmit}>
          <h2>创建新活动</h2>
          {/* ... 表单内容 ... */}
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




  // --- ↓↓↓↓ 新增的签到模态框 JSX ↓↓↓↓ ---
  const renderSignInModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleSignInSubmit}>
          <h2>活动签到</h2>
          <p>正在为活动: <strong>{selectedActivity?.activity_name}</strong> (ID: {selectedActivity?.activity_id}) 进行签到</p>
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

// --- ↓↓↓↓↓↓ 核心修复在这里 ↓↓↓↓↓↓ ---
  // --- Main Component Render ---
  return (
    <div className={styles.container}>
      {isCreateModalOpen && renderCreateModal()}
      {isSignInModalOpen && renderSignInModal()}
      
      <div className={styles.header}>
        <h1>我的活动安排</h1>
        <button className={styles.button} onClick={() => setIsCreateModalOpen(true)}>+ 创建新活动</button>
      </div>
      
      {isLoading ? <p>正在加载...</p> : error ? <p className={styles.error}>错误: {error}</p> : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>活动名称</th>
              <th>地点</th>
              <th>活动日期</th>
              <th>活动时间</th>
              <th>状态</th>
              <th style={{width: '200px'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {staffActivities.length > 0 ? (
              staffActivities.map(act => {
                // 定义一些布尔值，让 JSX 更清晰
                const canSignIn = act.status === '报名中' || act.status === '进行中';
                const isFinished = act.status === '已结束';
                const isCancelable = act.status === '报名中';

                return (
                  <tr key={act.activity_id}>
                    <td>{act.activity_name}</td>
                    <td>{act.location}</td>
                    <td>{new Date(act.activity_date).toLocaleDateString('zh-CN')}</td>
                    <td>{act.activity_time.split(' ')[1].substring(0, 5)}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        color: 'white', 
                        backgroundColor: isCancelable ? '#1890ff' : (isFinished ? '#bfbfbf' : '#52c41a') 
                      }}>
                        {act.status}
                      </span>
                    </td>
                    <td className={styles.actions}>
                      {/* --- 更严谨的动态按钮渲染逻辑 --- */}
                      
                      {/* 只有在活动未结束时，才渲染“签到”按钮 */}
                      {!isFinished && (
                        <button 
                          className={`${styles.button} ${styles.editBtn}`}
                          onClick={() => openSignInModal(act)}
                          // 只有在可以签到的状态下，按钮才可用
                          disabled={!canSignIn}
                        >
                          签到
                        </button>
                      )}
                      
                      {/* 只有在活动未结束时，才渲染“取消”或“删除”按钮 */}
                      {!isFinished && (
                        <button 
                          className={`${styles.button} ${isCancelable ? styles.cancelBtn : styles.deleteBtn}`}
                          onClick={() => handleCancelOrDelete(act)}
                        >
                          {isCancelable ? '取消活动' : '删除活动'}
                        </button>
                      )}

                      {/* 如果活动已结束，可以显示一条提示文本 */}
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

// 别忘了在你的 ElderlyManagementPage.module.css 文件中确认有 cancelBtn 样式
// .cancelBtn { background-color: #faad14; /* 或者灰色 #ccc */ }