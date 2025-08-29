import React, { useState, useEffect, useCallback } from 'react';
import type { Device, DeviceStats, PaginatedResponse, DeviceUpdateDto } from '@smart-elderly-care/types';
import styles from './DeviceManagementPage.module.css';

// --- API Client (完整) ---
const apiClient = {
  getDevices: (params: { page: number; pageSize: number; search?: string }): Promise<PaginatedResponse<Device>> => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) query.append('search', params.search);
    return fetch(`/api-device/devices?${query.toString()}`).then(res => res.json());
  },
  getStats: (): Promise<{ data: DeviceStats }> => fetch('/api-device/statistics').then(res => res.json()),
  createDevice: (deviceData: DeviceUpdateDto): Promise<Device> => 
    fetch('/api-device/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    }).then(res => res.json()),
  updateDevice: (id: number, deviceData: DeviceUpdateDto): Promise<Device> =>
    fetch(`/api-device/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData),
    }).then(res => res.json()),
  deleteDevice: (id: number): Promise<void> => 
    fetch(`/api-device/${id}`, { method: 'DELETE' }).then(res => {
      if (!res.ok) throw new Error('删除失败');
    }),
};

// --- 统计卡片组件 (完整) ---
function StatCard({ title, value }: { title: string; value: number | string;}) {
  const colorMap: { [key: string]: string } = {
    '总设备数': styles.colorBlue,
    '正常设备': styles.colorGreen,
    '故障设备': styles.colorRed,
    '维护中设备': styles.colorYellow
  };
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statValue} ${colorMap[title]}`}>{value}</div>
      <div className={styles.statTitle}>{title}</div>
    </div>
  );
}

// --- 主页面组件 (完整) ---
export function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Partial<Device> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = { page: currentPage, pageSize: 10, search: submittedSearch };
      
      const [devicesResponse, statsResponse] = await Promise.all([
        apiClient.getDevices(params),
        apiClient.getStats(),
      ]);
      
      if (devicesResponse && Array.isArray(devicesResponse.data)) {
        setDevices(devicesResponse.data);
        setTotalPages(Math.ceil(devicesResponse.totalCount / 10)); 
      } else { setDevices([]); }

      if (statsResponse && statsResponse.data) {
        setStats(statsResponse.data);
      }

    } catch (err) {
      setError('数据加载失败，请检查网络或联系管理员。');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, submittedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 事件处理函数 (完整) ---
  const handleOpenModal = (device: Partial<Device> | null) => {
    setEditingDevice(device ? { ...device } : { deviceName: '', deviceType: '', status: '正常运行', location: '' });
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (editingDevice) setEditingDevice({ ...editingDevice, [e.target.name]: e.target.value }); 
  };
  
  const handleSave = async () => {
    if (!editingDevice) return;
    try {
      // 准备要发送的数据，确保符合 DTO 格式
      const deviceData: DeviceUpdateDto = {
        deviceName: editingDevice.deviceName || '',
        deviceType: editingDevice.deviceType || '',
        status: editingDevice.status || '正常运行',
        location: editingDevice.location || '',
        // 对于日期，如果是新创建，给一个当前日期；如果是编辑，保持不变
        installationDate: editingDevice.installationDate || new Date().toISOString(),
        // 其他可选字段...
        description: editingDevice.description || '',
        lastMaintenanceDate: editingDevice.lastMaintenanceDate || new Date().toISOString(),
        roomId: editingDevice.roomId || 0
      };

      if ('deviceId' in editingDevice && editingDevice.deviceId) {
        await apiClient.updateDevice(editingDevice.deviceId, deviceData);
      } else {
        await apiClient.createDevice(deviceData);
      }
      handleCloseModal();
      fetchData(); // 成功后刷新数据
    } catch (err) {
      console.error("保存失败:", err);
      // 可以在这里向用户显示一个错误提示
    }
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm(`确定要删除 ID 为 ${id} 的设备吗？`)) {
      try {
        await apiClient.deleteDevice(id);
        fetchData(); // 成功后刷新数据
      } catch (err) {
        console.error("删除失败:", err);
      }
    }
  };
  
  const handlePageChange = (newPage: number) => { 
    if (newPage > 0 && newPage <= totalPages) { 
      setCurrentPage(newPage); 
    } 
  };
  
  const handleSearchSubmit = () => { 
    setCurrentPage(1); 
    setSubmittedSearch(searchTerm); 
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>设备管理</h1>

      {stats && (
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <StatCard title="总设备数" value={stats.总设备数} />
            <StatCard title="正常设备" value={stats.正常设备} />
            <StatCard title="故障设备" value={stats.故障设备} />
            <StatCard title="维护中设备" value={stats.维护中设备} />
          </div>
          <button onClick={() => setIsStatsExpanded(!isStatsExpanded)} className={styles.toggleStatsButton}>
            {isStatsExpanded ? '收起详细信息 ▲' : '显示详细信息 ▼'}
          </button>
          
          {isStatsExpanded && (
            <div className={styles.detailedStats}>
              <div className={styles.distroGroup}>
                <h4>设备类型分布</h4>
                <div className={styles.distroList}>
                  {Object.entries(stats.设备类型分布).map(([type, count]) => (
                    <div key={type} className={styles.distroRow}>
                      <span className={styles.distroKey}>{type}</span>
                      <span className={styles.distroValue}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className={styles.distroGroup}>
                  <h4>状态分布</h4>
                  <div className={styles.distroList}>
                    {Object.entries(stats.状态分布).map(([status, count]) => (
                      <div key={status} className={styles.distroRow}>
                        <span className={styles.distroKey}>{status}</span>
                        <span className={styles.distroValue}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.distroGroup}>
                  <h4>分配情况</h4>
                  <div className={styles.distroList}>
                    <div className={styles.distroRow}>
                      <span className={styles.distroKey}>已分配房间设备</span>
                      <span className={styles.distroValue}>{stats.已分配房间设备}</span>
                    </div>
                     <div className={styles.distroRow}>
                      <span className={styles.distroKey}>未分配房间设备</span>
                      <span className={styles.distroValue}>{stats.未分配房间设备}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.actionBar}>
        <div className={styles.searchGroup}>
          <input 
            type="text" 
            placeholder="按设备名称搜索..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          />
          <button className={styles.searchButton} onClick={handleSearchSubmit}>搜索</button>
        </div>
        <button className={styles.addButton} onClick={() => handleOpenModal(null)}>+ 新增设备</button>
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
                <th>上次维护</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.deviceId}>
                  <td>{device.deviceId}</td>
                  <td>{device.deviceName}</td>
                  <td>{device.deviceType}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[device.status.toLowerCase().replace(/\s/g, '')]}`}>
                      {device.status}
                    </span>
                  </td>
                  <td>{device.location}</td>
                  <td>{device.lastMaintenanceDate ? new Date(device.lastMaintenanceDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => handleOpenModal(device)}>编辑</button>
                      <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(device.deviceId)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className={styles.paginationContainer}>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          上一页
        </button>
        <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          下一页
        </button>
      </div>
      
      {isModalOpen && editingDevice && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2>{editingDevice.deviceId ? '编辑设备' : '新增设备'}</h2>
            <div className={styles.formGroup}>
              <label>设备名称</label>
              <input name="deviceName" value={editingDevice.deviceName || ''} onChange={handleFormChange} />
            </div>
            <div className={styles.formGroup}>
              <label>设备类型</label>
              <input name="deviceType" value={editingDevice.deviceType || ''} onChange={handleFormChange} />
            </div>
            <div className={styles.formGroup}>
              <label>状态</label>
              <input name="status" value={editingDevice.status || ''} onChange={handleFormChange} />
            </div>
            <div className={styles.formGroup}>
              <label>位置</label>
              <input name="location" value={editingDevice.location || ''} onChange={handleFormChange} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelButton} onClick={handleCloseModal}>取消</button>
              <button className={styles.saveButton} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}