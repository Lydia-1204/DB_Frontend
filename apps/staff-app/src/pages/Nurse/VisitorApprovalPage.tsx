import React, { useState, useEffect } from 'react';
import type { VisitorRegistration } from '@smart-elderly-care/types';
// 复用统一的样式
import styles from './ElderlyManagementPage.module.css';

export function VisitorApprovalPage() {
  const [registrations, setRegistrations] = useState<VisitorRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVisitorRegistrations();
  }, []);

  const fetchVisitorRegistrations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. 使用 GET /api/VisitorRegistration 获取所有预约请求
      const response = await fetch('/api/VisitorRegistration');
      if (!response.ok) {
        throw new Error('获取访客预约列表失败');
      }
      const data: VisitorRegistration[] = await response.json();
      setRegistrations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (registrationId: number) => {
    try {
      // 2. 使用 PUT /api/VisitorRegistration/{id}/approve 完成审批
      const response = await fetch(`/api/VisitorRegistration/${registrationId}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`审批请求 #${registrationId} 失败`);
      }
      // 审批成功后，刷新列表以更新状态
      fetchVisitorRegistrations();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // 也可以添加一个拒绝的逻辑，如果后端提供了拒绝的API
  const handleReject = async (registrationId: number) => {
    // 假设有 /api/VisitorRegistration/{id}/reject
    alert(`功能待实现：拒绝请求 #${registrationId}`);
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>访客审批</h1>
      </div>

      {isLoading && <p>正在加载预约列表...</p>}
      {error && <p className={styles.error}>{error}</p>}
      
      {!isLoading && !error && (
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
            {registrations.map((reg) => (
              <tr key={reg.visitor_id}>
                <td>{reg.visitor_name}</td>
                <td>{reg.elderly_id}</td>
                <td>{reg.visit_type}</td>
                <td>{formatDateTime(reg.visit_time)}</td>
                <td>
                  <span style={{ 
                    color: reg.approval_status === 'Approved' ? 'green' : (reg.approval_status === 'Pending' ? 'orange' : 'red'),
                    fontWeight: 'bold'
                  }}>
                    {reg.approval_status}
                  </span>
                </td>
                <td className={styles.actions}>
                  {reg.approval_status === 'Pending' && (
                    <>
                      <button className={`${styles.button} ${styles.editBtn}`} onClick={() => handleApprove(reg.visitor_id)}>
                        批准
                      </button>
                      <button className={`${styles.button} ${styles.deleteBtn}`} onClick={() => handleReject(reg.visitor_id)}>
                        拒绝
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}