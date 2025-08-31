import React, { useState, useEffect, FormEvent } from 'react';
import type { StaffInfo } from '@smart-elderly-care/types';
import styles from './StaffManagementPage.module.css';

const initialNewStaff: Partial<StaffInfo> = {
  staffId: 0,
  name: '',
  gender: '',
  position: '',
  contactPhone: '',
  skillLevel: 'none',
  workSchedule: 'Mon-Fri 08:00-16:00',
  email: '',
  hireDate: new Date().toISOString().split('T')[0],
  salary: 0,
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseWorkSchedule = (schedule: string | undefined) => {
  const defaults = { startDay: 'Mon', endDay: 'Fri', startTime: '08:00', endTime: '16:00' };
  if (!schedule) return defaults;
  const parts = schedule.split(' ');
  if (parts.length !== 2) return defaults;
  const dayParts = parts[0].split('-');
  if (dayParts.length !== 2) return defaults;
  const [startDay, endDay] = dayParts;
  const timeParts = parts[1].split('-');
  if (timeParts.length !== 2) return defaults;
  const [startTime, endTime] = timeParts;
  if (!weekdays.includes(startDay) || !weekdays.includes(endDay)) return defaults;
  return { startDay, endDay, startTime, endTime };
};

export function StaffManagementPage() {
  // --- State for filtering and searching ---
  const [masterStaffList, setMasterStaffList] = useState<StaffInfo[]>([]); // Stores the original, clean data from the API
  const [searchTerm, setSearchTerm] = useState(''); // Manages the search input value
  const [selectedPosition, setSelectedPosition] = useState('all'); // Manages the position filter dropdown

  // --- Original State ---
  const [staffList, setStaffList] = useState<StaffInfo[]>([]); // Now used to display the *filtered* results
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<StaffInfo> | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const [startDay, setStartDay] = useState('Mon');
  const [endDay, setEndDay] = useState('Fri');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');

  const fetchStaffList = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api-staff/staff-info/staff');
      if (!response.ok) throw new Error('获取员工列表失败');
      const data: StaffInfo[] = await response.json();

      // **CORE LOGIC 1: Filter out "主管" (Manager) position right after fetching**
      const filteredData = data.filter(staff => staff.position !== 'Supervisor');
      
      // **CORE LOGIC 2: Set the master list with this clean data**
      setMasterStaffList(filteredData);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  // **CORE LOGIC 3: New useEffect to perform filtering whenever dependencies change**
  useEffect(() => {
    let results = masterStaffList;

    // Step A: Filter by selected position
    if (selectedPosition !== 'all') {
      results = results.filter(staff => staff.position === selectedPosition);
    }

    // Step B: Filter by search term (on top of the position filter)
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter(staff => 
        staff.name.toLowerCase().includes(lowercasedTerm) || // Match by name (case-insensitive)
        String(staff.staffId).includes(lowercasedTerm)       // Match by ID
      );
    }

    // Step C: Update the list that will be rendered
    setStaffList(results);
  }, [searchTerm, selectedPosition, masterStaffList]); // This effect re-runs when these values change

  // Original useEffects for modal logic remain unchanged
  useEffect(() => {
    if (isModalOpen && editingStaff) {
      const newWorkSchedule = `${startDay}-${endDay} ${startTime}-${endTime}`;
      if (editingStaff.workSchedule !== newWorkSchedule) {
        setEditingStaff(prev => ({ ...prev!, workSchedule: newWorkSchedule }));
      }
    }
  }, [startDay, endDay, startTime, endTime, isModalOpen, editingStaff]);

  useEffect(() => {
    if (editingStaff && editingStaff.position !== 'Nurse' && editingStaff.skillLevel !== 'none') {
      setEditingStaff(prev => ({ ...prev!, skillLevel: 'none' }));
    }
  }, [editingStaff?.position]);

  const handleOpenModalForEdit = async (id: number) => {
    setModalMode('edit');
    setIsModalOpen(true);
    setIsFormLoading(true);
    try {
      const response = await fetch(`/api-staff/staff-info/staff/${id}`);
      if (!response.ok) throw new Error('获取员工详细信息失败');
      const staffDetails: StaffInfo = await response.json();
      staffDetails.hireDate = staffDetails.hireDate?.split('T')[0];
      setEditingStaff(staffDetails);
      const { startDay, endDay, startTime, endTime } = parseWorkSchedule(staffDetails.workSchedule);
      setStartDay(startDay);
      setEndDay(endDay);
      setStartTime(startTime);
      setEndTime(endTime);
    } catch (err: any) {
      alert(err.message);
      handleCloseModal();
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleOpenModalForNew = () => {
    setModalMode('add');
    setEditingStaff(initialNewStaff);
    const { startDay, endDay, startTime, endTime } = parseWorkSchedule(initialNewStaff.workSchedule);
    setStartDay(startDay);
    setEndDay(endDay);
    setStartTime(startTime);
    setEndTime(endTime);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editingStaff) {
      setEditingStaff({ ...editingStaff, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const isEditing = modalMode === 'edit'; 
    const url = isEditing
      ? `/api-staff/staff-info/staff-infos/${editingStaff.staffId}`
      : '/api-staff/staff-info/staff';
    const method = isEditing ? 'PUT' : 'POST';
    
    const bodyToSend = {
      ...editingStaff,
      staffId: Number(editingStaff.staffId) || 0,
      salary: Number(editingStaff.salary) || 0,
      hireDate: editingStaff.hireDate ? new Date(editingStaff.hireDate).toISOString() : new Date().toISOString(),
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error((isEditing ? '更新失败: ' : '新增失败: ') + (errorData || response.statusText));
      }

      await fetchStaffList(); 
      handleCloseModal();

    } catch (err: any) {
       alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`确定要删除 ID 为 ${id} 的员工吗？`)) {
      try {
        const response = await fetch(`/api-staff/staff-info/staff/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('删除失败');
        await fetchStaffList();
        alert('删除成功');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (isLoading) return <div>正在加载主列表...</div>;
  if (error) return <div className={styles.error}>错误: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>员工管理</h1>
        {/* --- ADDED: Action bar for search and filter controls --- */}
        <div className={styles.actionBar}>
          <select 
            className={styles.filterSelect}
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
          >
            <option value="all">所有职位</option>
            <option value="Cleaner">Cleaner</option>
            <option value="维修工">维修工</option>
            <option value="Nurse">Nurse</option>
            <option value="Doctor">Doctor</option>
          </select>
          <input 
            type="text"
            placeholder="按ID或姓名搜索..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={handleOpenModalForNew} className={styles.button}>新增员工</button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>职位</th>
            <th>联系电话</th>
            <th>技能等级</th>
            <th>工作班次</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {/* **MODIFIED: Render based on `staffList` (the filtered list) ** */}
          {staffList.length > 0 ? (
            staffList.map(staff => (
              <tr key={staff.staffId}>
                <td>{staff.staffId}</td>
                <td>{staff.name}</td>
                <td>{staff.position}</td>
                <td>{staff.contactPhone}</td>
                <td>{staff.skillLevel}</td>
                <td>{staff.workSchedule}</td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => handleOpenModalForEdit(staff.staffId)} className={`${styles.button} ${styles.editBtn}`}>编辑</button>
                    <button onClick={() => handleDelete(staff.staffId)} className={`${styles.button} ${styles.deleteBtn}`}>删除</button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center' }}>
                {masterStaffList.length > 0 ? '没有找到符合条件的员工。' : '暂无员工数据。'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2>{modalMode === 'edit' ? '编辑员工' : '新增员工'}</h2>
            {isFormLoading ? (
              <div>正在加载员工信息...</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>员工 ID</label>
                  <input 
                    type="number" 
                    name="staffId" 
                    value={editingStaff?.staffId || 0} 
                    onChange={handleFormChange} 
                    disabled={modalMode === 'edit'} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>姓名</label>
                  <input name="name" value={editingStaff?.name || ''} onChange={handleFormChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label>职位</label>
                  <select name="position" value={editingStaff?.position || ''} onChange={handleFormChange} required>
                    <option value="" disabled>请选择职位</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Doctor">Doctor</option>
                    <option value="维修工">维修工</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>技能等级 (仅护士可选)</label>
                  <select name="skillLevel" value={editingStaff?.skillLevel || 'none'} onChange={handleFormChange} disabled={editingStaff?.position !== 'Nurse'} >
                    <option value="Basic">Basic</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    {editingStaff?.position !== 'Nurse' && <option value="none">none</option>}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>性别</label>
                   <select name="gender" value={editingStaff?.gender || ''} onChange={handleFormChange}>
                    <option value="" disabled>请选择性别</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>联系电话</label>
                  <input name="contactPhone" value={editingStaff?.contactPhone || ''} onChange={handleFormChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" name="email" value={editingStaff?.email || ''} onChange={handleFormChange} />
                </div>
                <div className={styles.formGroup}>
                  <label>工作班次</label>
                  <div className={styles.scheduleContainer}>
                    <select value={startDay} onChange={(e) => setStartDay(e.target.value)}>
                      {weekdays.map(day => <option key={`start-${day}`} value={day}>{day}</option>)}
                    </select>
                    <span>-</span>
                    <select value={endDay} onChange={(e) => setEndDay(e.target.value)}>
                      {weekdays.map(day => <option key={`end-${day}`} value={day}>{day}</option>)}
                    </select>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    <span>-</span>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>入职日期</label>
                  <input type="date" name="hireDate" value={editingStaff?.hireDate || ''} onChange={handleFormChange} />
                </div>
                 <div className={styles.formGroup}>
                  <label>薪水</label>
                  <input type="number" name="salary" value={editingStaff?.salary || 0} onChange={handleFormChange} />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" onClick={handleCloseModal} className={`${styles.button} ${styles.cancelBtn}`}>取消</button>
                  <button type="submit" className={styles.button}>保存</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}