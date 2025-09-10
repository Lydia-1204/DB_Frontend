import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 请确保这里的 import 路径与你的项目结构匹配！
import type { BillingRecord, BillingApiResponse } from '@smart-elderly-care/types';
import styles from './BillingRecordsPage.module.css';

// --- API Client (已移除不再使用的 updateBillStatus) ---
const apiClient = {
  getBillingRecords: (params: { page: number; pageSize: number; }): Promise<BillingApiResponse> => {
    const query = new URLSearchParams({ 
        page: String(params.page), 
        pageSize: String(params.pageSize) 
    });
    return fetch(`/api-occupancy/billing/records?${query.toString()}`).then(res => res.json());
  },
};

// --- 主页面组件 (已移除所有更新状态相关的逻辑) ---
export function BillingRecordsPage() {
  const [allBills, setAllBills] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 100;

  const [statusFilter, setStatusFilter] = useState<'all' | '未支付' | '已支付'>('all');
  const [elderlyNameSearch, setElderlyNameSearch] = useState<string>('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getBillingRecords({ page: currentPage, pageSize: PAGE_SIZE });
      if (res.success && res.data) {
        setAllBills(res.data.items);
        setTotalPages(res.data.totalPages);
      } else {
        setAllBills([]);
        setTotalPages(0);
        console.warn(res.message || "未能获取账单记录");
      }
    } catch (err: any)
       {
      console.error("获取账单失败:", err);
      setError("获取账单失败，请检查网络连接！");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBills = useMemo(() => {
    const searchTerm = elderlyNameSearch.trim().toLowerCase();
    
    return allBills.filter(bill => {
      const statusMatch = statusFilter === 'all' || bill.paymentStatus === statusFilter;
      const nameMatch = searchTerm === '' || bill.elderlyName.toLowerCase().includes(searchTerm);
      return statusMatch && nameMatch;
    });
  }, [allBills, statusFilter, elderlyNameSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={styles.container}>
      <h1>账单记录管理</h1>

      <div className={styles.filterBar}>
        <div className={styles.formGroup}>
            <label>按支付状态筛选</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="all">所有状态</option>
                <option value="未支付">未支付</option>
                <option value="已支付">已支付</option>
            </select>
        </div>
        <div className={styles.formGroup}>
            <label>按老人姓名搜索</label>
            <input 
                type="text"
                placeholder="输入老人姓名..." 
                value={elderlyNameSearch} 
                onChange={(e) => setElderlyNameSearch(e.target.value)}
            />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.billingTable}>
          <thead>
            <tr>
              <th>账单ID</th>
              <th>老人姓名 (ID)</th>
              <th>房间号</th>
              <th>账单周期</th>
              <th>总金额</th>
              <th>支付状态</th>
              {/* 关键修正：操作列已移除 */}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{textAlign: 'center'}}>正在加载账单记录...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className={styles.errorText}>{error}</td></tr>
            ) : filteredBills.length > 0 ? (
              filteredBills.map(bill => (
                <tr key={bill.billingId}>
                  <td>{bill.billingId}</td>
                  <td>{bill.elderlyName} ({bill.elderlyId})</td>
                  <td>{bill.roomNumber}</td>
                  <td>{new Date(bill.billingStartDate).toLocaleDateString()} - {new Date(bill.billingEndDate).toLocaleDateString()}</td>
                  <td>¥{bill.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${bill.paymentStatus === '已支付' ? styles.paid : styles.unpaid}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  {/* 关键修正：操作单元格已移除 */}
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{textAlign: 'center'}}>没有找到符合条件的账单记录。</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>上一页</button>
          <span>第 {currentPage} 页 / 共 {totalPages} 页</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>下一页</button>
        </div>
      )}
    </div>
  );
}