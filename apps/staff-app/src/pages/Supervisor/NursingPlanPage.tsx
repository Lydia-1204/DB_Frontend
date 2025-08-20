import React, { useState, useEffect, FormEvent } from 'react';
import type { NursingPlan } from '@smart-elderly-care/types';
import styles from './NursingPlanPage.module.css'; 

type NursingPlanFormData = Omit<NursingPlan, 'careType' | 'priority'> & {
  planId: number | '';
  careType: 'Normal' | 'Emergency';
  priority: 'Basic' | 'Normal' | 'High';
  planStartDate: string;
  planEndDate: string;
};


export function NursingPlanPage() {
  const [nursingPlans, setNursingPlans] = useState<NursingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NursingPlan | null>(null);
  
  const initialFormData: NursingPlanFormData = {
    planId: 0,
    elderlyId: 0,
    staffId: 0,
    planStartDate: '',
    planEndDate: '',
    careType: 'Normal',
    priority: 'Normal',
    evaluationStatus: 'Scheduled',
  };
  const [formData, setFormData] = useState<NursingPlanFormData>(initialFormData);

  const fetchNursingPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api-staff/staff-info/nursing-plans');
      if (!response.ok) throw new Error('获取护理计划失败');
      const data: NursingPlan[] = await response.json();
      setNursingPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNursingPlans();
  }, []);

  const openModalForCreate = () => {
    setEditingPlan(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openModalForEdit = (plan: NursingPlan) => {
    setEditingPlan(plan);
    const formatDateTimeLocal = (isoString: string) => isoString.slice(0, 16);
    setFormData({
      ...plan,
      planStartDate: formatDateTimeLocal(plan.planStartDate),
      planEndDate: formatDateTimeLocal(plan.planEndDate),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['planId', 'elderlyId', 'staffId'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? (value === '' ? '' : parseInt(value, 10)) : value }));
  };
  
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const submissionData = {
      ...formData,
      planId: Number(formData.planId),
      planStartDate: `${formData.planStartDate}:00`,
      planEndDate: `${formData.planEndDate}:00`,
    };

    const url = editingPlan 
      ? `/api-staff/staff-info/nursing-plans/${editingPlan.planId}`
      : '/api-staff/staff-info/nursing-plans';
      
    const method = editingPlan ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) {
        throw new Error(editingPlan ? '修改失败' : '新增失败');
      }
      alert(editingPlan ? '修改成功！' : '新增成功！');
      closeModal();
      fetchNursingPlans();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!window.confirm('确定要启动智能排班吗？')) return;
    try {
      const response = await fetch('/api-staff/staff-info/nursing-schedule/generate', { method: 'POST' });
      if (!response.ok) throw new Error('智能排班失败');
      alert('智能排班成功启动！正在刷新列表...');
      fetchNursingPlans();
    } catch (err: any) {
      alert(err.message);
    }
  };
  
  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm(`【确认删除】\n是否要永久删除 ID 为 ${planId} 的护理计划？`)) return;
    try {
      const response = await fetch(`/api-staff/staff-info/nursing-plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败');
      alert('删除成功！');
      fetchNursingPlans();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className={styles.container}>正在加载...</div>;
  if (error) return <div className={styles.error}>错误: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>护理计划管理</h1>
        <div>
          <button onClick={openModalForCreate} className={styles.button}>+ 新增护理计划</button>
          <button onClick={handleGenerateSchedule} className={`${styles.button} ${styles.specialButton}`} style={{marginLeft: '10px'}}>
            🚀 一键智能排班
          </button>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>计划ID</th><th>老人ID</th><th>员工ID</th><th>护理类型</th><th>优先级</th>
            <th>开始时间</th><th>结束时间</th><th>状态</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {nursingPlans.map(plan => (
            <tr key={plan.planId}>
              <td>{plan.planId}</td><td>{plan.elderlyId}</td><td>{plan.staffId || '待分配'}</td>
              <td>{plan.careType}</td><td>{plan.priority}</td>
              <td>{new Date(plan.planStartDate).toLocaleString()}</td>
              <td>{new Date(plan.planEndDate).toLocaleString()}</td>
              <td>{plan.evaluationStatus}</td>
              <td>
                <div className={styles.actions}>
                  <button onClick={() => openModalForEdit(plan)} className={`${styles.button} ${styles.editBtn}`}>编辑</button>
                  <button onClick={() => handleDeletePlan(plan.planId)} className={`${styles.button} ${styles.deleteBtn}`}>删除</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2>{editingPlan ? '编辑护理计划' : '新增护理计划'}</h2>
            <form onSubmit={handleFormSubmit}>
                <div className={styles.formGroup}>
                  <label>护理计划 ID</label>
                  <input 
                    type="number" 
                    name="planId" 
                    value={formData.planId} 
                    onChange={handleFormChange}
                    readOnly={!!editingPlan} 
                    disabled={!!editingPlan}
                    required 
                  />
                </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>老人ID</label>
                  <input type="number" name="elderlyId" value={formData.elderlyId} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>员工ID</label>
                  <input type="number" name="staffId" value={formData.staffId} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>护理类型</label>
                  <select name="careType" value={formData.careType} onChange={handleFormChange}>
                    <option value="Normal">Normal</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>优先级</label>
                  <select name="priority" value={formData.priority} onChange={handleFormChange}>
                    <option value="Basic">Basic</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
                <div className={styles.formGroup} style={{marginTop: '16px'}}>
                  <label>计划开始时间</label>
                  <input type="datetime-local" name="planStartDate" value={formData.planStartDate} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>计划结束时间</label>
                  <input type="datetime-local" name="planEndDate" value={formData.planEndDate} onChange={handleFormChange} required />
                </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={closeModal} className={`${styles.button} ${styles.cancelBtn}`}>取消</button>
                <button type="submit" className={styles.button}>保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}