import React, { useState, useEffect, FormEvent } from 'react';
import type { SystemAnnouncement, NewAnnouncementPayload, NewCommentPayload, StaffInfo } from '@smart-elderly-care/types';
import styles from './AnnouncementsPage.module.css';

interface AnnouncementsPageProps {
  role: 'supervisor' | 'doctor' | 'nurse' | 'cleaner' | 'maintenance';
}

// 修改(2): 更新可供选择的观众选项，新增“全体”
const AUDIENCE_OPTIONS = ['员工', '家属', '全体'];

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ role }) => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 用于 Supervisor 发布新公告的模态框
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 修改(1): 将 newAnnouncement 的 audience 状态从数组改为字符串，并设置默认值
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    type: '通知', 
    content: '', 
    audience: '员工' as string // 默认为 '员工'
  });

  // 用于存储每个公告的评论输入框内容
  const [commentInputs, setCommentInputs] = useState<{[key: number]: string}>({});

  // 从 localStorage 获取当前登录的用户信息
  const loggedInUser: StaffInfo | null = JSON.parse(localStorage.getItem('loggedInUser') || 'null');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/SystemAnnouncement');
      if (!response.ok) throw new Error('获取公告列表失败');
      const data: SystemAnnouncement[] = await response.json();
      
      // 修改(3): 核心 - 更新前端过滤逻辑，显示受众为“员工”或“全体”的公告
      const filteredData = data.filter(ann => ann.audience === '员工' || ann.audience === '全体');
      
      // 按日期降序排序，最新的在最前面
      setAnnouncements(filteredData.sort((a, b) => new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime()));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 修改(4): 处理单选观众的逻辑，变得更简单
  const handleAudienceChange = (option: string) => {
    setNewAnnouncement(prev => ({ ...prev, audience: option }));
  };

  // 主管发布新公告
  const handlePostAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedInUser) return setError("无法获取用户信息，请重新登录");
    if (!newAnnouncement.audience) return setError("请选择一个公告受众");

    setIsSubmitting(true);
    const payload: NewAnnouncementPayload = {
      type: newAnnouncement.type,
      content: newAnnouncement.content,
      // 修改(5): audience 直接使用字符串，不再需要 join
      audience: newAnnouncement.audience,
      staffId: loggedInUser.staffId,
    };
    
    try {
      const response = await fetch('/api/SystemAnnouncement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('发布公告失败');
      setIsModalOpen(false);
      // 重置表单，audience 恢复默认值
      setNewAnnouncement({ type: '通知', content: '', audience: '员工'}); 
      fetchAnnouncements(); // 刷新列表
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 所有员工发表评论 (此函数逻辑无需修改)
  const handlePostComment = async (announcementId: number) => {
    const commentText = commentInputs[announcementId];
    if (!loggedInUser || !commentText || commentText.trim() === '') return;

    const payload: NewCommentPayload = {
      comment: commentText,
      commenterId: loggedInUser.staffId,
      commenterType: "员工", // 明确指定评论者类型
    };

    try {
        const response = await fetch(`/api/SystemAnnouncement/${announcementId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('发表评论失败');
        
        setCommentInputs(prev => ({ ...prev, [announcementId]: '' })); // 清空输入框
        fetchAnnouncements(); // 刷新以显示新评论
    } catch (err: any) {
        setError(err.message);
    }
  };
  

  // 主管使公告失效 (已根据新需求修改)
  const handleDeactivate = async (announcementId: number) => {
    // 步骤 1: 检查用户信息是否存在
    if (!loggedInUser) {
        setError("无法获取您的用户信息，请重新登录后再操作。");
        return;
    }
    
    if (!window.confirm("确定要使此公告失效吗？此操作不可逆。")) return;
    
    try {
        // 步骤 2: 构造请求体
        const payload = {
            staffId: loggedInUser.staffId
        };

        // 步骤 3: 更新 fetch 调用，加入 headers 和 body
        const response = await fetch(`/api/SystemAnnouncement/${announcementId}/deactivate`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('操作失败，请检查权限或联系管理员');
        
        fetchAnnouncements(); // 刷新列表以更新状态
    } catch (err: any) {
        setError(err.message);
    }
  };
  // 格式化评论，使其换行显示 (此函数逻辑无需修改)
  const formatComments = (comments: string) => {
    if (!comments || comments.trim() === '') return <p className={styles.noComments}>暂无评论</p>;
    return comments.split('\n').map((line, index) => (
        <p key={index} className={styles.commentLine}>{line}</p>
    ));
  };

  if (isLoading) return <div className={styles.loading}>正在加载公告...</div>;
  if (error) return <div className={styles.error}>错误: {error}</div>;

  const renderModal = () => (
    <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
        <form onSubmit={handlePostAnnouncement} className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>发布新公告</h2>
            <div className={styles.formGroup}>
                <label>公告类型</label>
                <input 
                    type="text" 
                    value={newAnnouncement.type} 
                    onChange={e => setNewAnnouncement(p => ({...p, type: e.target.value}))} 
                    required 
                />
            </div>
            <div className={styles.formGroup}>
                <label>公告内容</label>
                <textarea 
                    value={newAnnouncement.content} 
                    onChange={e => setNewAnnouncement(p => ({...p, content: e.target.value}))} 
                    required 
                    rows={5}
                />
            </div>
            <div className={styles.formGroup}>
                <label>选择受众</label>
                <div className={styles.audienceSelector}>
                    {AUDIENCE_OPTIONS.map(option => (
                        <button 
                            type="button" 
                            key={option}
                            onClick={() => handleAudienceChange(option)}
                            // 修改(6): 更新按钮激活状态的判断逻辑
                            className={`${styles.audienceBtn} ${newAnnouncement.audience === option ? styles.active : ''}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
            {error && <p className={styles.modalError}>{error}</p>}
            <div className={styles.modalActions}>
                <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsModalOpen(false)}>取消</button>
                <button type="submit" className={styles.button} disabled={isSubmitting}>
                    {isSubmitting ? '发布中...' : '确认发布'}
                </button>
            </div>
        </form>
    </div>
  );

  return (
    <div className={styles.container}>
      {isModalOpen && renderModal()}
      
      <div className={styles.header}>
        <h1>系统公告</h1>
        {role === 'supervisor' && (
          <button className={styles.button} onClick={() => setIsModalOpen(true)}>+ 发布新公告</button>
        )}
      </div>
      
      <div className={styles.announcementsList}>
        {announcements.length > 0 ? announcements.map(ann => (
          <div key={ann.announcement_id} className={`${styles.card} ${ann.status !== '已发布' ? styles.deactivated : ''}`}>
            <div className={styles.cardHeader}>
              <span className={styles.type}>{ann.announcement_type}</span>
              <span className={styles.status}>{ann.status}</span>
              <span className={styles.date}>{new Date(ann.announcement_date).toLocaleString()}</span>
              {role === 'supervisor' && ann.status === '已发布' && (
                  <button onClick={() => handleDeactivate(ann.announcement_id)} className={styles.deactivateBtn}>设为失效</button>
              )}
            </div>
            <div className={styles.cardBody}>
              <p>{ann.announcement_content}</p>
            </div>
            <div className={styles.commentsSection}>
              <strong>评论区:</strong>
              <div className={styles.comments}>{formatComments(ann.comments)}</div>
              <div className={styles.commentInputWrapper}>
                <input 
                    type="text" 
                    placeholder="友善发言，共建和谐..."
                    value={commentInputs[ann.announcement_id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [ann.announcement_id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(ann.announcement_id)}
                />
                <button onClick={() => handlePostComment(ann.announcement_id)}>发送</button>
              </div>
            </div>
          </div>
        )) : <p>暂无面向您的公告。</p>}
      </div>
    </div>
  );
};