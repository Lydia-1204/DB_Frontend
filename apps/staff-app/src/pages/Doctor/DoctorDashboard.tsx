import React, { useState, FormEvent, ChangeEvent } from 'react';
// 确保你的 types 包路径是正确的
import type { ElderlyProfile, NewMedicalOrderPayload, StaffInfo } from '@smart-elderly-care/types'; 
// 假设这个组件存在，用于展示数据
import { ElderlyHealthDataViewer } from '../../components/Dashboard/ElderlyHealthDataViewer'; 
import styles from '../Nurse/ElderlyManagementPage.module.css';

// 为开具医嘱的表单状态定义类型
type NewOrderForm = { medicineId: string; dosage: string; frequency: string; duration: string; };

export const DoctorDashboard: React.FC = () => {
  // --- State Management ---
  const [searchId, setSearchId] = useState('');
  const [currentProfile, setCurrentProfile] = useState<ElderlyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // 只保留开具医嘱的表单 state
  const [newOrder, setNewOrder] = useState<NewOrderForm>({ medicineId: '', dosage: '', frequency: '', duration: '' });

  // --- Functions ---
  const fetchProfile = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ElderlyRecord/${id}`);
      if (!response.ok) throw new Error(`未找到ID为 ${id} 的老人档案`);
      const data: ElderlyProfile = await response.json();
      setCurrentProfile(data);
    } catch (err: any) {
      setError(err.message);
      setCurrentProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    setNotification(null);
    fetchProfile(searchId);
  };
  
  // 表单内容变化的通用处理函数
  const handleOrderFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({ ...prev, [name]: value }));
  };
  
  // --- ↓↓↓↓↓↓ 核心修正点在这里 ↓↓↓↓↓↓ ---
  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return setError("请先加载一位老人的档案");
    
    const userString = localStorage.getItem('loggedInUser');
    if (!userString) return setError("无法获取医生信息，请重新登录");
    const doctor: StaffInfo = JSON.parse(userString);
    
    // 严格按照最新的 API 格式构建 payload 对象
    const payload: NewMedicalOrderPayload = {
      elderly_id: currentProfile.elderlyInfo.elderlyId,
      staff_id: doctor.staffId, // 确保从 StaffInfo 中获取正确的字段名
      medicine_id: Number(newOrder.medicineId),
      order_date: new Date().toISOString(),
      dosage: newOrder.dosage,
      frequency: newOrder.frequency,
      duration: newOrder.duration,
      orderId: 0,
      elderlyId: 0,
      staffId: 0,
      medicineId: 0,
      orderDate: ''
    };

    console.log("即将发送的医嘱 Payload:", JSON.stringify(payload, null, 2));

    setNotification("正在提交医嘱...");
    setError(null); // 清除旧的错误信息
    try {
      // 假设医嘱相关的 API 代理前缀是 /api-medical
      // 如果不是，请修改为正确的路径，例如 /api/medical/orders
      const response = await fetch('/api/medical/orders', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`开具医嘱失败 (状态码: ${response.status}): ${errorBody || '未知错误'}`);
      }
      setNotification("医嘱开具成功！");
      setNewOrder({ medicineId: '', dosage: '', frequency: '', duration: '' }); // 清空表单
      // 重新加载档案数据，以显示刚刚添加的新医嘱
      fetchProfile(String(currentProfile.elderlyInfo.elderlyId));
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };
  // --- ↑↑↑↑↑↑ 核心修正点在这里 ↑↑↑↑↑↑ ---

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>医生工作台</h1></div>
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={searchId} 
          onChange={(e) => setSearchId(e.target.value)} 
          placeholder="输入老人ID以加载其健康档案..." 
          style={{ flexGrow: 1, padding: '10px' }} 
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? '加载中...' : '加载档案'}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {notification && <p style={{ color: 'green' }}>{notification}</p>}

      {currentProfile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
          {/* 左侧数据展示区 */}
          <ElderlyHealthDataViewer profile={currentProfile} />
          
          {/* 右侧操作区 */}
          <div>
            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{marginTop: 0}}>开具新医嘱</h3>
              <form onSubmit={handleSubmitOrder}>
                <div className={styles.formGroup}><label>药品ID</label><input name="medicineId" type="number" value={newOrder.medicineId} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>剂量</label><input name="dosage" type="text" value={newOrder.dosage} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>频次</label><input name="frequency" type="text" value={newOrder.frequency} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>持续时间</label><input name="duration" type="text" value={newOrder.duration} onChange={handleOrderFormChange} required /></div>
                <button type="submit" className={styles.button}>确认开具</button>
              </form>
            </section>
            
            {/* 健康报告功能已移除 */}
            
          </div>
        </div>
      )}
    </div>
  );
};