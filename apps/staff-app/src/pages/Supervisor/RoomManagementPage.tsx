import React, { useState, useEffect, useCallback } from 'react';
// 请确保这里的 import 路径与你的项目结构匹配！
import type { 
  Room, RoomApiResponse, RoomStatsResponse, RoomDto, RoomStatsData, 
  SingleRoomApiResponse, MutationApiResponse 
} from '@smart-elderly-care/types';
import styles from './RoomManagementPage.module.css';

// --- API Client ---
const apiClient = {
  getRooms: (params: { page: number; pageSize: number; search?: string }): Promise<RoomApiResponse> => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search && params.search.trim() !== '') {
      query.set('search', params.search);
    }
    return fetch(`/api-room/rooms?${query.toString()}`).then(res => res.json());
  },
  getRoomById: (roomId: number): Promise<SingleRoomApiResponse> => 
    fetch(`/api-room/rooms/${roomId}`).then(res => res.json()),
  getStats: (): Promise<RoomStatsResponse> =>
    fetch('/api-room/rooms/statistics').then(res => res.json()),
  createRoom: (roomData: RoomDto): Promise<MutationApiResponse> =>
    fetch('/api-room/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomData) }).then(res => res.json()),
  updateRoom: (roomId: number, roomData: RoomDto): Promise<MutationApiResponse> =>
    fetch(`/api-room/rooms/${roomId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomData) }).then(res => res.json()),
  deleteRoom: (roomId: number): Promise<Response> =>
    fetch(`/api-room/rooms/${roomId}`, { method: 'DELETE' }),
};

// --- 子组件：单个统计卡片 ---
function StatCard({ title, value, color }: { title: string; value: number | string; color?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statTitle}>{title}</div>
    </div>
  );
}

// --- 全新的、可展开的统计信息组件 ---
function StatsDisplay({ statsData }: { statsData: RoomStatsData | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!statsData) {
    return (
      <div className={styles.statsContainer}>
        <div className={styles.mainStatsGrid}>
          <StatCard title="总房间数" value="..." />
          <StatCard title="可用房间" value="..." />
          <StatCard title="已入住" value="..." />
          <StatCard title="维护中" value="..." />
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.statsContainer}>
      <div className={styles.mainStatsGrid}>
        <StatCard title="总房间数" value={statsData.totalRooms} />
        <StatCard title="可用房间" value={statsData.availableRooms} color="#52c41a" />
        <StatCard title="已入住" value={statsData.occupiedRooms} color="#ff4d4f" />
        <StatCard title="维护中" value={statsData.maintenanceRooms} color="#faad14" />
      </div>
      <div className={styles.toggleButtonContainer}>
        <button onClick={() => setIsExpanded(!isExpanded)} className={styles.toggleButton}>
          {isExpanded ? '收起详细信息 ▲' : '显示详细信息 ▼'}
        </button>
      </div>
      {isExpanded && (
        <div className={styles.detailedStatsGrid}>
          <div className={styles.statsList}>
            <h4>按类型分布 (总数/可用)</h4>
            <ul>{statsData.roomTypeStats.map(s => <li key={s.roomType}><span>{s.roomType}:</span> <strong>{s.count} / {s.availableCount}</strong></li>)}</ul>
          </div>
          <div className={styles.statsList}>
            <h4>按楼层分布 (总数/可用)</h4>
            <ul>{statsData.floorStats.map(s => <li key={s.floor}><span>{s.floor}楼:</span> <strong>{s.count} / {s.availableCount}</strong></li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 房间详情弹窗组件 ---
function RoomDetailsModal({ room, isOpen, onClose }: { room: Room | null, isOpen: boolean, onClose: () => void }) {
  if (!isOpen || !room) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>房间详情: {room.roomNumber}</h2>
        <div className={styles.detailsGrid}>
          <p><strong>ID:</strong> {room.roomId}</p>
          <p><strong>类型:</strong> {room.roomType}</p>
          <p><strong>状态:</strong> {room.status}</p>
          <p><strong>楼层:</strong> {room.floor}</p>
          <p><strong>容量:</strong> {room.capacity} 人</p>
          <p><strong>价格:</strong> ¥{room.rate.toFixed(2)}</p>
          <p><strong>床位:</strong> {room.bedType}</p>
          <p><strong>创建时间:</strong> {new Date(room.createdAt).toLocaleString()}</p>
        </div>
        <h4>房间内设备 ({room.devices?.length || 0})</h4>
        <ul className={styles.deviceList}>
          {room.devices && room.devices.length > 0 ? (
            room.devices.map(d => <li key={d.deviceId}>{d.deviceName} ({d.deviceType}) - 状态: {d.status}</li>)
          ) : (
            <li>暂无设备</li>
          )}
        </ul>
        <div className={styles.modalActions}>
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

// --- 新增/编辑房间的弹窗表单组件 ---
function RoomFormModal({ room, isOpen, onClose, onSave }: { room: Room | null, isOpen: boolean, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState<RoomDto>({ roomNumber: '', roomType: '单人间', capacity: 1, status: '空闲', rate: 1000, bedType: '单人床', floor: 1 });
  
  useEffect(() => {
    if (isOpen) {
      if (room) {
        setFormData({ roomNumber: room.roomNumber, roomType: room.roomType, capacity: room.capacity, status: room.status, rate: room.rate, bedType: room.bedType, floor: room.floor });
      } else {
        setFormData({ roomNumber: '', roomType: '单人间', capacity: 1, status: '空闲', rate: 1000, bedType: '单人床', floor: 1 });
      }
    }
  }, [room, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number' || ['capacity', 'floor', 'rate'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = room ? await apiClient.updateRoom(room.roomId, formData) : await apiClient.createRoom(formData);
      if (response.success) {
        alert(response.message || '操作成功！');
        onSave();
      } else {
        throw new Error(response.message || '操作失败，未知错误。');
      }
    } catch (error: any) {
      console.error("保存失败:", error);
      alert(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>{room ? '编辑房间信息' : '新增房间'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}><label>房间号</label><input name="roomNumber" value={formData.roomNumber} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>房间类型</label><input name="roomType" value={formData.roomType} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>楼层</label><input type="number" name="floor" value={formData.floor} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>容量</label><input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>床位类型</label><input name="bedType" value={formData.bedType} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>价格</label><input type="number" name="rate" value={formData.rate} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>状态</label><select name="status" value={formData.status} onChange={handleChange}><option value="空闲">空闲</option><option value="入住">入住</option><option value="维修">维修</option></select></div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>取消</button>
            <button type="submit">{room ? '更新' : '创建'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 主页面组件 ---
export function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [statsData, setStatsData] = useState<RoomStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);
  
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const roomsRes = await apiClient.getRooms({ page: currentPage, pageSize: PAGE_SIZE, search: searchTerm });
      if (roomsRes.success) {
        setRooms(roomsRes.data);
        setTotalCount(roomsRes.totalCount);
      } else {
        throw new Error(roomsRes.message || '获取房间列表失败');
      }
    } catch (err: any) {
      setError(err.message || '数据加载失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);
  
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await apiClient.getStats();
      if (statsRes.success && statsRes.data) {
        setStatsData(statsRes.data);
      }
    } catch (err) {
      console.error("获取统计数据失败", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenFormModal = (room: Room | null) => {
    setEditingRoom(room);
    setIsFormModalOpen(true);
  };
  
  const handleSaveSuccess = () => {
    setIsFormModalOpen(false);
    setEditingRoom(null);
    if (!editingRoom) setCurrentPage(1);
    fetchData(); 
    fetchStats();
  };

  const handleDelete = async (roomId: number) => {
    if (window.confirm('确定要删除这个房间吗？此操作不可撤销。')) {
      try {
        await apiClient.deleteRoom(roomId);
        alert('删除成功！');
        if (rooms.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchData();
        }
        fetchStats();
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败！');
      }
    }
  };

  const handleViewDetails = async (roomId: number) => {
    try {
      const res = await apiClient.getRoomById(roomId);
      if (res.success) {
        setSelectedRoomDetails(res.data);
        setIsDetailsModalOpen(true);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      alert(`获取房间详情失败: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <h1>房间管理</h1>
      
      <StatsDisplay statsData={statsData} />

      <div className={styles.actionBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
            <input type="text" placeholder="按房间号搜索..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className={styles.searchInput} />
            <button type="submit">搜索</button>
        </form>
        <button onClick={() => handleOpenFormModal(null)} className={styles.addButton}>+ 新增房间</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.roomTable}>
          <thead>
            <tr>
              <th>房间号</th><th>类型</th><th>楼层</th><th>状态</th>
              <th>容量</th><th>床位类型</th><th>价格</th><th>设备数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center' }}>正在加载数据...</td></tr>
            ) : error ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
            ) : rooms.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center' }}>没有找到任何房间。</td></tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.roomId}>
                  <td><button onClick={() => handleViewDetails(room.roomId)} className={styles.linkButton}>{room.roomNumber}</button></td>
                  <td>{room.roomType}</td>
                  <td>{room.floor}</td>
                  <td><span className={`${styles.statusBadge} ${styles[room.status.toLowerCase()]}`}>{room.status}</span></td>
                  <td>{room.capacity}</td>
                  <td>{room.bedType}</td>
                  <td>¥{room.rate.toFixed(2)}</td>
                  <td>{room.devices?.length || 0}</td>
                  <td>
                    <button onClick={() => handleOpenFormModal(room)} className={`${styles.actionButton} ${styles.editButton}`}>编辑</button>
                    <button onClick={() => handleDelete(room.roomId)} className={`${styles.actionButton} ${styles.deleteButton}`}>删除</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className={styles.paginationContainer}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>上一页</button>
          <span>第 {currentPage} 页 / 共 {totalPages} 页 (共 {totalCount} 条)</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>下一页</button>
        </div>
      )}

      <RoomFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveSuccess} room={editingRoom} />
      <RoomDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} room={selectedRoomDetails} />
    </div>
  );
}