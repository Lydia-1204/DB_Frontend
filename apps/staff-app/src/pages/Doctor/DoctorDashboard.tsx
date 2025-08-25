import React, { useState, FormEvent, ChangeEvent } from 'react';
import type { ElderlyProfile, NewMedicalOrderPayload, NewHealthMonitoringRecordPayload, StaffInfo } from '@smart-elderly-care/types';
import { ElderlyHealthDataViewer } from '../../components/Dashboard/ElderlyHealthDataViewer';
import styles from '../Nurse/ElderlyManagementPage.module.css';

// 为表单状态定义更精确的类型
// 为表单状态定义更精确的类型
type NewOrderForm = { medicineId: string; dosage: string; frequency: string; duration: string; };
// ↓↓↓↓ 更新健康报告的表单状态类型 ↓↓↓↓
type NewMonitoringRecordForm = { heartRate: string; bloodPressure: string; oxygenLevel: string; temperature: string; };

export const DoctorDashboard: React.FC = () => {
  const [searchId, setSearchId] = useState('');
  const [currentProfile, setCurrentProfile] = useState<ElderlyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState<NewOrderForm>({ medicineId: '', dosage: '', frequency: '', duration: '' });
  const [newMonitoringRecord, setNewMonitoringRecord] = useState<NewMonitoringRecordForm>({
    heartRate: '', bloodPressure: '', oxygenLevel: '', temperature: ''
  });

  // 封装一个独立的、可复用的 fetchProfile 函数
  const fetchProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ElderlyRecord/${id}`);
      if (!response.ok) throw new Error(`未找到ID为 ${id} 的老人档案`);
      const data: ElderlyProfile = await response.json();
      setCurrentProfile(data);
    } catch (err: any) {
      setError(err.message);
      setCurrentProfile(null); // 出错时清空档案
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchId) return;
    setError(null);
    setNotification(null);
    fetchProfile(searchId);
  };

  // 使用泛型来创建一个类型安全的 handleFormChange
  const handleFormChange = <T,>(e: ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<T>>) => {
    const { name, value } = e.target;
    setter(prev => ({ ...prev, [name]: value }));
  };
  
 // ↓↓↓↓↓↓ 核心修正点在这里 ↓↓↓↓↓↓
  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return setError("请先加载一位老人的档案");
    const userString = localStorage.getItem('loggedInUser');
    if (!userString) return setError("无法获取医生信息，请重新登录");
    const doctor: StaffInfo = JSON.parse(userString);
    
   // 严格按照 API 文档的顺序来构建 payload 对象
    const payload: NewMedicalOrderPayload = {
      orderId: 0,
      elderlyId: currentProfile.elderlyInfo.elderlyId,
      staffId: doctor.staffId,
      medicineId: Number(newOrder.medicineId),
      orderDate: new Date().toISOString(),
      dosage: newOrder.dosage, // 手动指定每一个字段
      frequency: newOrder.frequency,
      duration: newOrder.duration,
    };

    console.log("即将发送的医嘱 Payload (已修正顺序):", JSON.stringify(payload, null, 2));

    setNotification("正在提交医嘱...");
    try {
      const response = await fetch('/api/MedicalOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`开具医嘱失败 (状态码: ${response.status}): ${errorBody || '未知错误'}`);
      }
      setNotification("医嘱开具成功！");
      setNewOrder({ medicineId: '', dosage: '', frequency: '', duration: '' });
      fetchProfile(String(currentProfile.elderlyInfo.elderlyId));
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };
  // ↑↑↑↑↑↑ 核心修正点在这里 ↑↑↑↑↑↑
  
  // ↓↓↓↓↓↓ 核心修改：重写 handleSubmitReport 函数 ↓↓↓↓↓↓
  const handleSubmitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return setError("请先加载一位老人的档案");

    // 构建新的 payload，并进行类型转换
    const payload: NewHealthMonitoringRecordPayload = {
      elderlyId: currentProfile.elderlyInfo.elderlyId,
      heartRate: Number(newMonitoringRecord.heartRate),
      bloodPressure: newMonitoringRecord.bloodPressure,
      oxygenLevel: Number(newMonitoringRecord.oxygenLevel),
      temperature: Number(newMonitoringRecord.temperature),
      measurementTime: new Date().toISOString(),
    };

    setNotification("正在提交健康报告...");
    try {
        // 使用新的 API 路径
        const response = await fetch('/api/HealthMonitoring/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`提交报告失败: ${errorBody}`);
        }
        setNotification("健康报告提交成功！");
        // 清空新的表单
        setNewMonitoringRecord({ heartRate: '', bloodPressure: '', oxygenLevel: '', temperature: '' });
        // 刷新档案数据以显示新记录
        fetchProfile(String(currentProfile.elderlyInfo.elderlyId));
    } catch (err: any) {
        setError(err.message);
        setNotification(null);
    }
  };
  // ↑↑↑↑↑↑ 核心修改在这里 ↑↑↑↑↑↑

  return (
    <div className={styles.container}>
      <div className={styles.header}><h1>医生工作台</h1></div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="输入老人ID以加载其健康档案..." style={{ flexGrow: 1, padding: '10px' }} />
        <button type="submit" className={styles.button} disabled={isLoading}>{isLoading ? '加载中...' : '加载档案'}</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}
      {notification && <p style={{ color: 'green' }}>{notification}</p>}

      {currentProfile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
          <ElderlyHealthDataViewer profile={currentProfile} />
          <div>
            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{marginTop: 0}}>开具医嘱</h3>
              <form onSubmit={handleSubmitOrder}>
                <div className={styles.formGroup}><label>药品ID</label><input name="medicineId" type="number" value={newOrder.medicineId} onChange={e => handleFormChange(e, setNewOrder)} required /></div>
                <div className={styles.formGroup}><label>剂量</label><input name="dosage" type="text" value={newOrder.dosage} onChange={e => handleFormChange(e, setNewOrder)} required /></div>
                <div className={styles.formGroup}><label>频次</label><input name="frequency" type="text" value={newOrder.frequency} onChange={e => handleFormChange(e, setNewOrder)} required /></div>
                <div className={styles.formGroup}><label>持续时间</label><input name="duration" type="text" value={newOrder.duration} onChange={e => handleFormChange(e, setNewOrder)} required /></div>
                <button type="submit" className={styles.button}>确认开具</button>
              </form>
            </section>
            {/* ↓↓↓↓↓↓ 核心修改：更新健康报告表单的 JSX ↓↓↓↓↓↓ */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '24px' }}>
              <h3 style={{marginTop: 0}}>提供健康报告</h3>
              <form onSubmit={handleSubmitReport}>
                <div className={styles.formGroup}><label>心率 (bpm)</label><input name="heartRate" type="number" value={newMonitoringRecord.heartRate} onChange={e => handleFormChange(e, setNewMonitoringRecord)} required /></div>
                <div className={styles.formGroup}><label>血压 (例如: 120/80)</label><input name="bloodPressure" type="text" value={newMonitoringRecord.bloodPressure} onChange={e => handleFormChange(e, setNewMonitoringRecord)} required /></div>
                <div className={styles.formGroup}><label>血氧饱和度 (%)</label><input name="oxygenLevel" type="number" step="0.1" value={newMonitoringRecord.oxygenLevel} onChange={e => handleFormChange(e, setNewMonitoringRecord)} required /></div>
                <div className={styles.formGroup}><label>体温 (°C)</label><input name="temperature" type="number" step="0.1" value={newMonitoringRecord.temperature} onChange={e => handleFormChange(e, setNewMonitoringRecord)} required /></div>
                <button type="submit" className={styles.button}>提交报告</button>
              </form>
            </section>
             {/* ↑↑↑↑↑↑ 核心修改在这里 ↑↑↑↑↑↑ */}
          </div>
        </div>
      )}
    </div>
  );
};