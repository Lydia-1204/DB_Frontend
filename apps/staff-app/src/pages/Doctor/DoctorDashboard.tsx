import React, { useState, FormEvent, ChangeEvent } from 'react';
import type { ElderlyProfile, NewMedicalOrderPayload, DispenseMedicinePayload, StaffInfo } from '@smart-elderly-care/types';
import { ElderlyHealthDataViewer } from '../../components/Dashboard/ElderlyHealthDataViewer';
import styles from '../Nurse/ElderlyManagementPage.module.css';

// --- 表单状态类型定义 ---
type NewOrderForm = { medicineId: string; dosage: string; frequency: string; duration: string; };
type DispenseForm = { medicineId: string; quantity: string; paymentMethod: string; remarks: string; };
// 新增：健康数据表单类型
type HealthDataForm = {
  heartRate: string;
  bloodPressure: string;
  oxygenLevel: string;
  temperature: string;
};

export const DoctorDashboard: React.FC = () => {
  // --- State Management ---
  const [searchId, setSearchId] = useState('');
  const [currentProfile, setCurrentProfile] = useState<ElderlyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState<NewOrderForm>({ medicineId: '', dosage: '', frequency: '', duration: '' });
  const [newDispense, setNewDispense] = useState<DispenseForm>({ medicineId: '', quantity: '', paymentMethod: '线上支付', remarks: '' });
  // 新增：健康数据表单状态
  const [healthData, setHealthData] = useState<HealthDataForm>({ heartRate: '', bloodPressure: '', oxygenLevel: '', temperature: '' });

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
  
  const handleOrderFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewOrder(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      setError("请先加载一位老人的档案");
      return;
    }
    
    const userString = localStorage.getItem('loggedInUser');
    if (!userString) {
      setError("无法获取医生信息，请重新登录");
      return;
    }
    const doctor: StaffInfo = JSON.parse(userString);
    
    const payload: NewMedicalOrderPayload = {
      elderly_id: currentProfile.elderlyInfo.elderlyId,
      staff_id: doctor.staffId,
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

    setNotification("正在提交医嘱...");
    setError(null);
    try {
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
      setNewOrder({ medicineId: '', dosage: '', frequency: '', duration: '' });
      fetchProfile(String(currentProfile.elderlyInfo.elderlyId));
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };
  
  const handleDispenseFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDispense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitDispense = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      setError("请先加载一位老人的档案");
      return;
    }
    const userString = localStorage.getItem('loggedInUser');
    if (!userString) {
      setError("无法获取医生信息，请重新登录");
      return;
    }
    const doctor: StaffInfo = JSON.parse(userString);
    
    const payload: DispenseMedicinePayload = {
      elderly_Id: currentProfile.elderlyInfo.elderlyId,
      medicine_Id: Number(newDispense.medicineId),
      quantity: Number(newDispense.quantity),
      staff_Id: doctor.staffId,
      payment_Method: newDispense.paymentMethod,
      remarks: newDispense.remarks,
      bill_Id: "1",
      order_Id: 1,
      settlement_Id: 1,
    };

    setNotification("正在提交开药信息...");
    setError(null);
    try {
      const response = await fetch('/api/medical/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`开药失败: ${errorBody || `状态码 ${response.status}`}`);
      }
      setNotification("药品开具成功！");
      setNewDispense({ medicineId: '', quantity: '', paymentMethod: '线上支付', remarks: '' });
      fetchProfile(String(currentProfile.elderlyInfo.elderlyId)); 
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };

  // --- 新增：健康数据表单处理函数 ---
  const handleHealthDataFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHealthData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitHealthData = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentProfile) {
      setError("请先加载一位老人的档案");
      return;
    }

    const payload = {
      elderlyId: currentProfile.elderlyInfo.elderlyId,
      heartRate: Number(healthData.heartRate),
      bloodPressure: healthData.bloodPressure,
      oxygenLevel: Number(healthData.oxygenLevel),
      temperature: Number(healthData.temperature),
      measurementTime: new Date().toISOString()
    };

    setNotification("正在提交健康数据...");
    setError(null);
    try {
      // 使用新的 API 路径，该路径会被代理到 3003 端口
      const response = await fetch('/api/HealthMonitoring/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`提交失败: ${errorBody || `状态码 ${response.status}`}`);
      }

      setNotification("健康数据提交成功！");
      setHealthData({ heartRate: '', bloodPressure: '', oxygenLevel: '', temperature: '' }); // 成功后清空表单
      // 重新加载老人档案以显示最新数据
      fetchProfile(String(currentProfile.elderlyInfo.elderlyId));
    } catch (err: any) {
      setError(err.message);
      setNotification(null);
    }
  };
  
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
                {/* ... 医嘱表单字段 ... */}
                <div className={styles.formGroup}><label>药品ID</label><input name="medicineId" type="number" value={newOrder.medicineId} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>剂量</label><input name="dosage" type="text" value={newOrder.dosage} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>频次</label><input name="frequency" type="text" value={newOrder.frequency} onChange={handleOrderFormChange} required /></div>
                <div className={styles.formGroup}><label>持续时间</label><input name="duration" type="text" value={newOrder.duration} onChange={handleOrderFormChange} required /></div>
                <button type="submit" className={styles.button}>确认开具</button>
              </form>
            </section>
            
            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '24px' }}>
              <h3 style={{marginTop: 0}}>发药</h3>
              <form onSubmit={handleSubmitDispense}>
                {/* ... 发药表单字段 ... */}
                <div className={styles.formGroup}><label>药品ID</label><input name="medicineId" type="number" value={newDispense.medicineId} onChange={handleDispenseFormChange} required /></div>
                <div className={styles.formGroup}><label>数量</label><input name="quantity" type="number" value={newDispense.quantity} onChange={handleDispenseFormChange} required /></div>
                <div className={styles.formGroup}><label>支付方式</label><select name="paymentMethod" value={newDispense.paymentMethod} onChange={handleDispenseFormChange} style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}><option value="线上支付">线上支付</option><option value="现金">现金</option></select></div>
                <div className={styles.formGroup}><label>备注</label><input name="remarks" type="text" value={newDispense.remarks} onChange={handleDispenseFormChange} /></div>
                <button type="submit" className={styles.button}>确认开药</button>
              </form>
            </section>

            {/* --- ↓↓↓↓ 新增的健康数据上传表单 ↓↓↓↓ --- */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '24px' }}>
              <h3 style={{marginTop: 0}}>上传健康数据</h3>
              <form onSubmit={handleSubmitHealthData}>
                <div className={styles.formGroup}>
                  <label>心率 (次/分)</label>
                  <input name="heartRate" type="number" value={healthData.heartRate} onChange={handleHealthDataFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>血压 (mmHg)</label>
                  <input name="bloodPressure" type="text" placeholder="例如: 120/80" value={healthData.bloodPressure} onChange={handleHealthDataFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>血氧饱和度 (%)</label>
                  <input name="oxygenLevel" type="number" value={healthData.oxygenLevel} onChange={handleHealthDataFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>体温 (°C)</label>
                  <input name="temperature" type="number" step="0.1" value={healthData.temperature} onChange={handleHealthDataFormChange} required />
                </div>
                <button type="submit" className={styles.button}>提交数据</button>
              </form>
            </section>
            
          </div>
        </div>
      )}
    </div>
  );
};