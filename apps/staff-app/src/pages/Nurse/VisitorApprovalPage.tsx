import React, { useState, useEffect } from 'react';

// ---------------------------
// -- 类型定义
// ---------------------------

// 定义一个明确的状态类型，增强代码可读性和类型安全
type ApprovalStatus = "待批准" | "已批准" | "已拒绝";

export interface VisitorRegistration {
  registrationId: number;
  visitorId: number;
  elderlyId: number;
  visitorName: string;
  visitTime: string;
  relationshipToElderly: string;
  visitReason: string;
  visitType: string;
  approvalStatus: ApprovalStatus;
}

interface StaffInfo {
  staffId: number;
  [key: string]: any; 
}

// 复用统一的样式
import styles from './ElderlyManagementPage.module.css';


// ---------------------------
// -- 主组件
// ---------------------------

export function VisitorApprovalPage() {
  // --- State 定义 ---
  const [registrations, setRegistrations] = useState<VisitorRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StaffInfo | null>(null);

  // 关键修改 #1: 增加用于管理筛选状态的 state，默认为 "待批准"
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus>('待批准');

  // --- Effect Hooks ---

  useEffect(() => {
    const userStr = localStorage.getItem('loggedInUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        setError("无法加载用户信息，请检查登录状态。");
      }
    } else {
        setError("用户未登录，无法获取访客列表。");
    }
  }, []);

  // 关键修改 #2: 在 useEffect 的依赖数组中加入 filterStatus
  // 这样当用户切换筛选条件时，也会自动调用 fetchVisitorRegistrations
  useEffect(() => {
    if (currentUser && currentUser.staffId) {
      fetchVisitorRegistrations();
    }
  }, [currentUser, filterStatus]); // 依赖 currentUser 和 filterStatus

  // --- API 调用函数 ---

  const fetchVisitorRegistrations = async () => {
    if (!currentUser?.staffId) return;

    setIsLoading(true);
    setError(null);
    try {
      // 关键修改 #3: API 请求中的 status 参数现在是动态的，由 filterStatus state 决定
      const response = await fetch(`/api/VisitorRegistration?staffId=${currentUser.staffId}&status=${filterStatus}`);
      if (!response.ok) {
        throw new Error(`获取访客列表失败 (状态: ${filterStatus})`);
      }
      const data: VisitorRegistration[] = await response.json();
      setRegistrations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovalAction = async (registrationId: number, isApproved: boolean) => {
    if (!currentUser?.staffId) return alert("无法获取当前用户信息，请重新登录后再试。");

    const reason = isApproved ? "访客身份验证通过" : "信息不符，已拒绝";
    try {
      await fetch(`/api/VisitorRegistration/${registrationId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: isApproved, reason, staffId: currentUser.staffId }),
      });
      // 操作成功后，重新获取当前筛选条件下的列表
      fetchVisitorRegistrations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- 辅助函数 ---

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusStyle = (status: ApprovalStatus) => {
    switch (status) {
      case '已批准': return { color: 'green', fontWeight: 'bold' };
      case '待批准': return { color: 'orange', fontWeight: 'bold' };
      case '已拒绝': return { color: 'red', fontWeight: 'bold' };
      default: return {};
    }
  };

  // --- 渲染逻辑 ---

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>访客审批</h1>
      </div>

      {/* 关键修改 #4: 添加用于筛选的UI按钮 */}
      <div className={styles.filterControls}>
        {(['待批准', '已批准', '已拒绝'] as ApprovalStatus[]).map((status) => (
          <button
            key={status}
            className={`${styles.filterButton} ${filterStatus === status ? styles.active : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      
      {!error && (
        isLoading ? <p>正在加载列表...</p> : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>访客姓名</th>
                <th>探访老人ID</th>
                <th>探访类型</th>
                <th>预约时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length > 0 ? registrations.map((reg) => (
                <tr key={reg.registrationId}>
                  <td>{reg.visitorName}</td>
                  <td>{reg.elderlyId}</td>
                  <td>{reg.visitType}</td>
                  <td>{formatDateTime(reg.visitTime)}</td>
                  <td>
                    <span style={getStatusStyle(reg.approvalStatus)}>
                      {reg.approvalStatus}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    {/* 操作按钮只在 "待批准" 列表下显示 */}
                    {reg.approvalStatus === '待批准' && (
                      <>
                        <button className={`${styles.button} ${styles.editBtn}`} onClick={() => handleApprovalAction(reg.registrationId, true)}>
                          批准
                        </button>
                        <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleApprovalAction(reg.registrationId, false)}>
                          拒绝
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  {/* 关键修改 #5: 空状态提示语根据当前筛选条件动态变化 */}
                  <td colSpan={6} style={{ textAlign: 'center' }}>{`暂无${filterStatus}的访客请求`}</td>
                </tr>
              )}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}