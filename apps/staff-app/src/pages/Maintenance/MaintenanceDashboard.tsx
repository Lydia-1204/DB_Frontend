import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import type { Device, PaginatedResponse, FaultReport, DeviceUpdateDto, StaffInfo } from '@smart-elderly-care/types';
import styles from './MaintenanceDashboard.module.css';

// --- API Client: 严格按照“前端只管发暗号”的原则重写 ---
const apiClient = {
  // 这个之前是正确的，保持不变
  getDevices: (params: { page: number; pageSize: number; search?: string }): Promise<PaginatedResponse<Device>> => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) query.append('search', params.search);
    // 正确：使用暗号 /api-device + 唯一路径 /devices
    return fetch(`/api-device/devices?${query.toString()}`).then(res => res.json());
  },

  // ↓↓↓ 核心修正：严格按照 API 文档和代理规则修正路径 ↓↓↓
  updateDevice: (id: number, deviceData: DeviceUpdateDto): Promise<Device> =>
    // 正确：使用暗号 /api-device + 唯一路径 /{id}
    fetch(`/api-device/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    }).then(res => {
      if (!res.ok) throw new Error('更新设备信息失败');
      // PUT 成功后后端可能不返回内容，所以我们这么处理
      return res.json().catch(() => ({}));
    }),

  // ↓↓↓ 核心修正：严格按照 API 文档和代理规则修正路径 ↓↓↓
  submitFaultReport: (reportData: FaultReport): Promise<any> =>
    // 正确：使用暗号 /api-device + 唯一路径 /fault-report
    fetch(`/api-device/fault-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    }).then(res => {
      if (!res.ok) throw new Error('故障报告提交失败');
      return res.json();
    }),
};

// --- 主页面组件 (逻辑部分与之前一致，无需修改) ---
export function MaintenanceDashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingDevice, setReportingDevice] = useState<Device | null>(null);
  const [faultDescription, setFaultDescription] = useState('');

  const fetchData = useCallback(async () => {
    try {
      if (!isLoading) setIsLoading(true);
      setError(null);
      const params = { page: currentPage, pageSize: 10, search: submittedSearch };
      const devicesResponse = await apiClient.getDevices(params);
      
      if (devicesResponse && Array.isArray(devicesResponse.data)) {
        setDevices(devicesResponse.data);
        setTotalPages(Math.ceil(devicesResponse.totalCount / 10)); 
      } else { setDevices([]); }
    } catch (err: any) {
      setError(err.message || '数据加载失败，请检查网络或联系管理员。');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, submittedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (device: Device) => {
    setReportingDevice(device);
    setFaultDescription('');
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleReportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reportingDevice || !faultDescription.trim()) return;
    
    const reportData: FaultReport = {
      deviceId: reportingDevice.deviceId,
      deviceType: reportingDevice.deviceType,
      faultStatus: "故障",
      faultDescription: faultDescription,
      reportTime: new Date().toISOString(),
    };

    try {
      await apiClient.submitFaultReport(reportData);
      alert('故障报告提交成功！');
      handleCloseModal();
      fetchData(); 
    } catch (err: any) {
      alert(err.message || '提交失败');
    }
  };

  const handleStatusChange = async (device: Device, newStatus: string) => {
    if (window.confirm(`确定要将设备 #${device.deviceId} 的状态更新为 "${newStatus}" 吗？`)) {
      try {
        const updatePayload: DeviceUpdateDto = {
          deviceName: device.deviceName,
          deviceType: device.deviceType,
          installationDate: device.installationDate,
          status: newStatus,
          roomId: device.roomId,
          description: device.description,
          location: device.location,
          lastMaintenanceDate: new Date().toISOString(),
        };

        await apiClient.updateDevice(device.deviceId, updatePayload);
        alert('状态更新成功！');
        fetchData();
      } catch (err: any) {
        alert(err.message || '更新失败');
      }
    }
  };
  
  const handlePageChange = (newPage: number) => { 
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage); 
  };
  
  const handleSearchSubmit = () => { 
    setCurrentPage(1); 
    setSubmittedSearch(searchTerm); 
  };
  
  const user: StaffInfo | null = JSON.parse(localStorage.getItem('loggedInUser') || 'null');

  return (
    // ↓↓↓ JSX 部分完全没有改变，无需修改 ↓↓↓
    <div className={styles.container}>
      <div className={styles.welcomeHeader}>
        <h1>{user ? `${user.name}的工作台` : '维修工工作台'}</h1>
        <p>请在这里监控设备状态并处理故障。</p>
      </div>

      <div className={styles.card}>
        <div className={styles.actionBar}>
           <div className={styles.searchGroup}>
            <input type="text" placeholder="按设备名称搜索..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()} />
            <button className={styles.searchButton} onClick={handleSearchSubmit}>搜索</button>
          </div>
        </div>
        <div className={styles.tableContainer}>
          {isLoading ? <p>正在加载数据...</p> : error ? <p>{error}</p> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>设备ID</th>
                  <th>设备名称</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>位置</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.deviceId}>
                    <td>{device.deviceId}</td>
                    <td>{device.deviceName}</td>
                    <td>{device.deviceType}</td>
                    <td><span className={`${styles.statusBadge} ${styles[device.status.toLowerCase().replace(/\s/g, '')]}`}>{device.status}</span></td>
                    <td>{device.location}</td>
                    <td>
                      <div className={styles.actions}>
                        {device.status === '正常运行' && (
                          <>
                            <button className={`${styles.actionButton} ${styles.reportButton}`} onClick={() => handleOpenModal(device)}>上报故障</button>
                            <button className={`${styles.actionButton} ${styles.maintainButton}`} onClick={() => handleStatusChange(device, '维护中')}>进行维护</button>
                          </>
                        )}
                        {device.status === '故障' && (
                          <button className={`${styles.actionButton} ${styles.maintainButton}`} onClick={() => handleStatusChange(device, '维护中')}>进行维护</button>
                        )}
                        {device.status === '维护中' && (
                          <button className={`${styles.actionButton} ${styles.fixButton}`} onClick={() => handleStatusChange(device, '正常运行')}>完成修复</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className={styles.pagination}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>上一页</button>
          <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>下一页</button>
        </div>
      </div>
      
      {isModalOpen && reportingDevice && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2>为设备 #{reportingDevice.deviceId} 上报故障</h2>
            <p><strong>设备名称:</strong> {reportingDevice.deviceName}</p>
            <form onSubmit={handleReportSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="faultDescription">故障描述</label>
                <textarea id="faultDescription" value={faultDescription} onChange={(e) => setFaultDescription(e.target.value)} rows={5} placeholder="请详细描述设备出现的故障现象..." required />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={handleCloseModal}>取消</button>
                <button type="submit" className={styles.saveButton}>确认提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}