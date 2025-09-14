import React, { useState, useEffect, useCallback } from 'react';
// 请确保这里的 import 路径与你的项目结构匹配！
import type { 
    CheckInDto, CheckOutDto, OccupancyRecord, 
    MutationApiResponse, OccupancyApiResponse 
} from '@smart-elderly-care/types';
import styles from './OccupancyManagementPage.module.css';

// --- API Client (此部分无需修改) ---
const apiClient = {
  getOccupancies: (params: { page: number; pageSize: number; status?: string; search?: string }): Promise<OccupancyApiResponse> => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.status) { query.set('status', params.status); }
    if (params.search && params.search.trim() !== '') { query.set('search', params.search); }
    return fetch(`/api-occupancy/occupancy-records?${query.toString()}`).then(res => res.json());
  },
  checkIn: (data: CheckInDto): Promise<MutationApiResponse> => 
    fetch('/api-occupancy/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
  checkOut: (data: CheckOutDto): Promise<MutationApiResponse> => 
    fetch('/api-occupancy/check-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
  generateAllBills: (selectedDateStr: string): Promise<MutationApiResponse> => {
    const parts = selectedDateStr.split('-').map(part => parseInt(part, 10));
    const year = parts[0];
    const monthIndex = parts[1] - 1; 
    const firstDayOfMonthUTC = new Date(Date.UTC(year, monthIndex, 1));
    const firstDayOfMonthISO = firstDayOfMonthUTC.toISOString();
    const requestBody = {
      billingStartDate: firstDayOfMonthISO,
      billingEndDate: firstDayOfMonthISO,
      
      remarks: `批量生成 ${year} 年 ${monthIndex + 1} 月账单`
    };
    return fetch('/api-occupancy/billing/generate-all', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(requestBody) 
    }).then(res => res.json());
  },
  generateSingleBill: (elderlyId: number, startDate: string): Promise<MutationApiResponse> => {
    const requestBody = { elderlyId: elderlyId, billingStartDate: startDate, billingEndDate: new Date().toISOString(), dailyRate: 1.0, remarks: `为老人ID ${elderlyId} 生成账单` };
    return fetch(`/api-occupancy/elderly/${elderlyId}/billing/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }).then(res => res.json());
  }
};

// 辅助函数 (无修改)
const translateStatus = (status: 'Checked In' | 'Checked Out' | string): string => {
    switch (status) {
        case 'Checked In': return '入住中';
        case 'Checked Out': return '已退房';
        default: return status;
    }
};

// --- 主页面组件 ---
export function OccupancyManagementPage() {
  const [activeTab, setActiveTab] = useState<'check-in' | 'check-out-billing'>('check-in');
  const [checkInForm, setCheckInForm] = useState<Omit<CheckInDto, 'checkInDate'>>({ elderlyId: 0, roomId: 0, bedNumber: '', remarks: '' });
  
  const [occupancies, setOccupancies] = useState<OccupancyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'入住中' | ''>('入住中');
  const [selectedOccupancy, setSelectedOccupancy] = useState<OccupancyRecord | null>(null);
  const [checkOutRemarks, setCheckOutRemarks] = useState('');
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- 修改开始 ---
  // 1. 新增一个辅助函数，用于获取 "YYYY-MM" 格式的当前月份字符串
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // padStart确保月份是两位数
    return `${year}-${month}`;
  };

  // 2. 将 state 重命名为 billingMonth 并使用新函数初始化，使其默认显示当前月份
  const [billingMonth, setBillingMonth] = useState<string>(getCurrentMonth());
  // --- 修改结束 ---

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchOccupancies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const apiStatus = statusFilter === '入住中' ? 'Checked In' : '';
        const res = await apiClient.getOccupancies({ 
            page: currentPage, 
            pageSize: PAGE_SIZE, 
            status: apiStatus,
            search: searchTerm
        });
        if (res.success && res.data) {
          setOccupancies(res.data.items);
          setTotalCount(res.data.totalCount);
        } else {
          setOccupancies([]);
          setTotalCount(0);
        }
    } catch (err: any) {
      setError("获取入住列表失败！");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'check-out-billing') {
      fetchOccupancies();
    }
  }, [activeTab, fetchOccupancies]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCheckInForm(prev => ({ ...prev, [name]: name === 'remarks' || name === 'bedNumber' ? value : Number(value) }));
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInForm.elderlyId || !checkInForm.roomId) {
        alert("老人ID和房间ID必须是有效的数字！"); return;
    }
    const submissionData: CheckInDto = { ...checkInForm, checkInDate: new Date().toISOString() };
    try {
      const res = await apiClient.checkIn(submissionData);
      if (res.success) {
        alert(res.message || '入住登记成功！');
        setCheckInForm({ elderlyId: 0, roomId: 0, bedNumber: '', remarks: '' });
      } else { throw new Error(res.message || "入住登记失败"); }
    } catch (error: any) { alert(`操作失败: ${error.message}`); }
  };

  const handleCheckOut = async () => {
    if (!selectedOccupancy) return;
    const submissionData: CheckOutDto = { 
        occupancyId: selectedOccupancy.occupancyId, 
        checkOutDate: new Date().toISOString(),
        remarks: checkOutRemarks,
    };
    try {
        const res = await apiClient.checkOut(submissionData);
        if(res.success) {
            alert(res.message || '退房成功！');
            setSelectedOccupancy(null);
            setCheckOutRemarks('');
            fetchOccupancies();
        } else { throw new Error(res.message || "退房操作失败"); }
    } catch (error: any) { alert(`操作失败: ${error.message}`); }
  };

  // --- 修改开始 ---
  // 3. 修改“一键生成账单”的提交处理函数
  const handleGenerateAllBills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingMonth) {
      alert("请选择一个账单月份！"); return; // 更新提示信息
    }
    // 更新确认弹窗的提示
    if (window.confirm(`确定要为 ${billingMonth} 月份，生成所有在住老人的账单吗？`)) {
        try {
            // 将 "YYYY-MM" 格式的月份字符串拼接成 "YYYY-MM-01"
            // 以便复用 apiClient 中已有的、处理时区问题的逻辑
            const firstDayOfMonthStr = `${billingMonth}-01`;
            const res = await apiClient.generateAllBills(firstDayOfMonthStr);
            if (res.success) {
                alert(res.message || '所有账单已成功生成！');
            } else { throw new Error(res.message || '生成账单失败'); }
        } catch (error: any) { alert(`操作失败: ${error.message}`); }
    }
  };
  // --- 修改结束 ---
  
  const handleGenerateBillFromCheckout = async (elderlyId: number) => {
    const startDate = window.prompt("请输入该老人的账单起始日期 (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!startDate) return;
    if (window.confirm(`确定要从 ${startDate} 开始，为老人ID ${elderlyId} 生成本月账单吗？`)) {
        try {
            const res = await apiClient.generateSingleBill(elderlyId, new Date(startDate).toISOString());
            if (res.success) {
                alert(res.message || `账单已成功生成！`);
            } else { throw new Error(res.message || '生成账单失败'); }
        } catch (error: any) { alert(`操作失败: ${error.message}`); }
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSearchTerm(searchInput);
  };

  return (
    <div className={styles.container}>
      <h1>入住与结算管理</h1>
      
      <div className={styles.billingSection}>
        <h3>全局账单生成</h3>
        <p>此操作将根据选定月份所有老人的入住情况，为他们生成该月待支付的房费账单。</p>
        <form onSubmit={handleGenerateAllBills} className={styles.globalBillingForm}>
          <div className={styles.formGroup}>
            {/* --- 修改开始 --- */}
            {/* 4. 将 input 的 type 从 "date" 改为 "month"，并更新 state 绑定 */}
            <label>选择账单月份 </label>
            <input 
              type="month" 
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              required 
            />
            {/* --- 修改结束 --- */}
          </div>
          <button type="submit" className={styles.actionButton}>一键生成所有账单</button>
        </form>
      </div>

      <div className={styles.tabContainer}>
        <button onClick={() => setActiveTab('check-in')} className={`${styles.tabButton} ${activeTab === 'check-in' ? styles.activeTab : ''}`}>入住登记</button>
        <button onClick={() => setActiveTab('check-out-billing')} className={`${styles.tabButton} ${activeTab === 'check-out-billing' ? styles.activeTab : ''}`}>退房与记录查询</button>
      </div>

      {/* --- 后续的 JSX 代码无修改 --- */}
      {activeTab === 'check-in' && (
        <div className={styles.formContainer}>
          <h2>办理入住</h2>
          <form onSubmit={handleCheckInSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>老人ID *</label><input type="number" name="elderlyId" value={checkInForm.elderlyId || ''} onChange={handleCheckInChange} placeholder="请输入老人ID" required /></div>
              <div className={styles.formGroup}><label>房间ID *</label><input type="number" name="roomId" value={checkInForm.roomId || ''} onChange={handleCheckInChange} placeholder="请输入房间ID" required /></div>
              <div className={styles.formGroup}><label>床位号 *</label><input name="bedNumber" value={checkInForm.bedNumber} onChange={handleCheckInChange} placeholder="请输入床位号" required /></div>
              <div className={styles.formGroup}><label>备注</label><input name="remarks" value={checkInForm.remarks} onChange={handleCheckInChange} placeholder="（可选）" /></div>
            </div>
            <button type="submit" className={styles.submitButton}>确认入住</button>
          </form>
        </div>
      )}

      {activeTab === 'check-out-billing' && (
        <div className={styles.listContainer}>
          <h2>入住记录查询与退房</h2>
          <div className={styles.actionBar}>
            <div className={styles.filterGroup}>
              <label>筛选状态：</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="入住中">仅看入住中</option>
                <option value="">查看所有</option>
              </select>
            </div>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                <input type="text" placeholder="按老人姓名搜索..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className={styles.searchInput}/>
                <button type="submit" className={styles.searchButton}>搜索</button>
            </form>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.occupancyTable}>
              <thead>
                  <tr>
                      <th>ID</th><th>老人姓名</th><th>房间号</th><th>状态</th><th>入住日期</th><th>操作</th>
                  </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className={styles.tableMessage}>正在加载...</td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className={`${styles.tableMessage} ${styles.errorText}`}>{error}</td></tr>
                ) : occupancies.length > 0 ? occupancies.map(occ => (
                  <tr key={occ.occupancyId}>
                    <td>{occ.occupancyId}</td>
                    <td>{occ.elderlyName}</td>
                    <td>{occ.roomNumber}</td>
                    <td><span className={`${styles.statusBadge} ${occ.status === 'Checked In' ? styles.checkedIn : styles.checkedOut}`}>{translateStatus(occ.status)}</span></td>
                    <td>{new Date(occ.checkInDate).toLocaleDateString()}</td>
                    <td>
                      {occ.status === 'Checked In' ? (
                        <button onClick={() => setSelectedOccupancy(occ)} className={styles.actionButton}>办理退房</button>
                      ) : (
                        <span className={styles.noAction}> - </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className={styles.tableMessage}>没有找到符合条件的记录。</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalCount > PAGE_SIZE && (
              <div className={styles.pagination}>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>上一页</button>
                  <span>第 {currentPage} 页 / 共 {totalPages} 页 (共 {totalCount} 条)</span>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>下一页</button>
              </div>
          )}

          {selectedOccupancy && (
            <div className={styles.checkOutCard}>
                <h4>为 {selectedOccupancy.elderlyName} (房间 {selectedOccupancy.roomNumber}) 办理退房</h4>
                <div className={styles.formGroup}>
                    <label>退房备注</label>
                    <input value={checkOutRemarks} onChange={(e) => setCheckOutRemarks(e.target.value)} placeholder="（可选）"/>
                </div>
                <div className={styles.checkOutActions}>
                    <button onClick={() => handleGenerateBillFromCheckout(selectedOccupancy.elderlyId)} className={styles.secondaryButton}>生成账单</button>
                    <button onClick={handleCheckOut} className={styles.primaryButton}>确认退房</button>
                    <button onClick={() => setSelectedOccupancy(null)} className={styles.cancelButton}>取消</button>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}