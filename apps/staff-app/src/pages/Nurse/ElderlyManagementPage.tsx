import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ElderlyInfo, NewElderlyRegistration } from '@smart-elderly-care/types';
import styles from './ElderlyManagementPage.module.css';

// 定义 props 类型 (保持不变)
interface ElderlyManagementPageProps {
  role: 'nurse' | 'doctor';
}

export function ElderlyManagementPage({ role }: ElderlyManagementPageProps) {
  // --- 状态声明 (保持不变) ---
  const [allElderly, setAllElderly] = useState<ElderlyInfo[]>([]);
  const [displayedElderly, setDisplayedElderly] = useState<ElderlyInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 为表单提供更合理的初始值
  const initialFormData: NewElderlyRegistration = {
    elderly: { name: '', gender: 'Male', birthDate: '', idCardNumber: '', contactPhone: '', address: '', emergencyContact: '' },
    assessment: { assessmentDate: '', physicalHealthFunction: 80, psychologicalFunction: 80, cognitiveFunction: 80, healthGrade: 'Good' },
    monitoring: { monitoringDate: '', heartRate: 75, bloodPressure: '120/80', oxygenLevel: 98, temperature: 36.5, status: '正常' },
    families: [{ name: '', relationship: '', contactPhone: '', contactEmail: '', address: '', isPrimaryContact: 'Y' }],
  };
  const [newElderlyData, setNewElderlyData] = useState<NewElderlyRegistration>(initialFormData);

  const navigate = useNavigate();

  // --- 数据获取和过滤逻辑 (保持不变) ---
  useEffect(() => {
    fetchAndSetAllElderly();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setDisplayedElderly(allElderly);
    } else {
      const filtered = allElderly.filter(e =>
        e.elderlyId != 0 &&
        (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(e.elderlyId).includes(searchTerm))
      );
      setDisplayedElderly(filtered);
    }
  }, [searchTerm, allElderly]);

  const fetchAndSetAllElderly = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ElderlyInfo');
      if (!response.ok) throw new Error('获取老人列表失败');
      const data: ElderlyInfo[] = await response.json();
         // --- 新增代码：在这里进行过滤 ---
      const filteredData = data.filter(elderly => elderly.elderlyId > 0);
      // 使用过滤后的数据更新状态
      setAllElderly(filteredData);
      setDisplayedElderly(filteredData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 类型安全的表单处理逻辑 (保持不变) ---
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, section: 'elderly' | 'assessment' | 'monitoring' | 'families', index?: number) => {
    const { name, value } = e.target;
    
    setNewElderlyData(prev => {
      const newData = JSON.parse(JSON.stringify(prev)); // Deep copy for safety
      
      if (section === 'families' && index !== undefined) {
        newData.families[index][name as keyof typeof newData.families[0]] = value;
      } else if (section !== 'families') {
        const sectionData = newData[section];
        const key = name as keyof typeof sectionData;
        // Handle numeric conversion
        if (typeof sectionData[key] === 'number') {
          (sectionData[key] as any) = Number(value);
        } else {
          (sectionData[key] as any) = value;
        }
      }
      return newData;
    });
  };

  // --- 提交新老人登记 (保持不变) ---
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const now = new Date().toISOString();
    const dataToSubmit = {
      ...newElderlyData,
      elderly: { ...newElderlyData.elderly, birthDate: new Date(newElderlyData.elderly.birthDate).toISOString() },
      assessment: { ...newElderlyData.assessment, assessmentDate: now },
      monitoring: { ...newElderlyData.monitoring, monitoringDate: now },
    };
    try {
      const response = await fetch('/api/CheckIn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`登记失败: ${errorText}`);
      }
      setIsModalOpen(false);
      setNewElderlyData(initialFormData); // 重置表单
      fetchAndSetAllElderly();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModal = () => (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <form onSubmit={handleRegisterSubmit}>
          <h2>登记新老人信息</h2>
          
          <h4>老人基本信息</h4>
          <div className={styles.formGroup}><label>姓名</label><input name="name" type="text" value={newElderlyData.elderly.name} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          <div className={styles.formGroup}><label>性别</label><select name="gender" value={newElderlyData.elderly.gender} onChange={(e) => handleFormChange(e, 'elderly')}><option value="Male">男</option><option value="Female">女</option></select></div>
          <div className={styles.formGroup}><label>出生日期</label><input name="birthDate" type="date" value={newElderlyData.elderly.birthDate} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          <div className={styles.formGroup}><label>身份证号</label><input name="idCardNumber" type="text" value={newElderlyData.elderly.idCardNumber} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          <div className={styles.formGroup}><label>联系电话</label><input name="contactPhone" type="tel" value={newElderlyData.elderly.contactPhone} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          <div className={styles.formGroup}><label>家庭住址</label><input name="address" type="text" value={newElderlyData.elderly.address} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          <div className={styles.formGroup}><label>紧急联系人</label><input name="emergencyContact" type="text" value={newElderlyData.elderly.emergencyContact} onChange={(e) => handleFormChange(e, 'elderly')} required /></div>
          
          <hr /><h4>初始健康评估</h4>
          <div className={styles.formGroup}><label>生理机能评分</label><input name="physicalHealthFunction" type="number" value={newElderlyData.assessment.physicalHealthFunction} onChange={(e) => handleFormChange(e, 'assessment')} /></div>
          <div className={styles.formGroup}><label>心理功能评分</label><input name="psychologicalFunction" type="number" value={newElderlyData.assessment.psychologicalFunction} onChange={(e) => handleFormChange(e, 'assessment')} /></div>
          <div className={styles.formGroup}><label>认知功能评分</label><input name="cognitiveFunction" type="number" value={newElderlyData.assessment.cognitiveFunction} onChange={(e) => handleFormChange(e, 'assessment')} /></div>
          <div className={styles.formGroup}><label>健康等级</label><input name="healthGrade" type="text" value={newElderlyData.assessment.healthGrade} onChange={(e) => handleFormChange(e, 'assessment')} /></div>
          
          <hr /><h4>初始健康监测</h4>
          <div className={styles.formGroup}><label>心率 (bpm)</label><input name="heartRate" type="number" value={newElderlyData.monitoring.heartRate} onChange={(e) => handleFormChange(e, 'monitoring')} /></div>
          <div className={styles.formGroup}><label>血压 (例如 120/80)</label><input name="bloodPressure" type="text" value={newElderlyData.monitoring.bloodPressure} onChange={(e) => handleFormChange(e, 'monitoring')} /></div>
          <div className={styles.formGroup}><label>血氧饱和度 (%)</label><input name="oxygenLevel" type="number" step="0.1" value={newElderlyData.monitoring.oxygenLevel} onChange={(e) => handleFormChange(e, 'monitoring')} /></div>
          <div className={styles.formGroup}><label>体温 (°C)</label><input name="temperature" type="number" step="0.1" value={newElderlyData.monitoring.temperature} onChange={(e) => handleFormChange(e, 'monitoring')} /></div>
          <div className={styles.formGroup}><label>状态</label><select name="status" value={newElderlyData.monitoring.status} onChange={(e) => handleFormChange(e, 'monitoring')}><option value="正常">正常</option><option value="轻微异常">轻微异常</option><option value="异常">异常</option></select></div>
          
          <hr /><h4>家属信息 (至少一位)</h4>
          <div className={styles.formGroup}><label>家属姓名</label><input name="name" type="text" value={newElderlyData.families[0].name} onChange={(e) => handleFormChange(e, 'families', 0)} required /></div>
          <div className={styles.formGroup}><label>与老人关系</label><input name="relationship" type="text" value={newElderlyData.families[0].relationship} onChange={(e) => handleFormChange(e, 'families', 0)} required /></div>
          <div className={styles.formGroup}><label>家属联系电话</label><input name="contactPhone" type="tel" value={newElderlyData.families[0].contactPhone} onChange={(e) => handleFormChange(e, 'families', 0)} required /></div>
          <div className={styles.formGroup}><label>家属邮箱</label><input name="contactEmail" type="email" value={newElderlyData.families[0].contactEmail} onChange={(e) => handleFormChange(e, 'families', 0)} /></div>
          <div className={styles.formGroup}><label>家属住址</label><input name="address" type="text" value={newElderlyData.families[0].address} onChange={(e) => handleFormChange(e, 'families', 0)} /></div>
          <div className={styles.formGroup}><label>是否主联系人</label><select name="isPrimaryContact" value={newElderlyData.families[0].isPrimaryContact} onChange={(e) => handleFormChange(e, 'families', 0)}><option value="Y">是</option><option value="N">否</option></select></div>

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.button} ${styles.cancelBtn}`} onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="submit" className={styles.button} disabled={isSubmitting}>{isSubmitting ? '提交中...' : '确认登记'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {isModalOpen && renderModal()}
      <div className={styles.header}>
        <h1>老人管理</h1>
        {/* ↓↓↓↓ 核心修改：条件渲染按钮 ↓↓↓↓ */}
        {role === 'nurse' && (
          <button className={styles.button} onClick={() => setIsModalOpen(true)}>
            + 登记新老人
          </button>
        )}
      </div>
      <input
        type="text"
        placeholder="按姓名或ID搜索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '24px', width: '100%', padding: '10px', boxSizing: 'border-box' }}
      />
      {isLoading ? <p>正在加载...</p> : error ? <p className={styles.error}>错误: {error}</p> : (
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>姓名</th><th>性别</th><th>操作</th></tr></thead>
          <tbody>
            {displayedElderly.map((elderly) => (
              <tr key={elderly.elderlyId}>
                <td>{elderly.elderlyId}</td>
                <td>{elderly.name}</td>
                <td>{elderly.gender}</td>
                <td><button className={styles.button} onClick={() => navigate(`/${role}/elderly-management/${elderly.elderlyId}`)}>查看档案</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}