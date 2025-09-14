import React, { useState, useEffect, useCallback } from 'react';
// 确保这里的 import 路径与你的项目结构匹配！
import type {
  MedicalApiResponse, MedicineProcurement, MedicineStockDto,
  AggregatedMedicineStock, MedicineStockBatch
} from '@smart-elderly-care/types';
import styles from './MedicineInventoryPage.module.css';

// --- API Client ---
const apiClient = {
  getProcurements: (): Promise<MedicalApiResponse<MedicineProcurement[]>> =>
    fetch('/api-medical/procurements').then(res => res.json()),
  markAsReceived: (procurementId: number): Promise<Response> =>
    fetch(`/api-medical/procurements/${procurementId}/receive`, { method: 'PUT' }),
  procureMedicine: (stockData: MedicineStockDto): Promise<Response> =>
    fetch('/api-medical/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockData),
    }),
  getAggregatedStock: (): Promise<MedicalApiResponse<AggregatedMedicineStock[]>> =>
    fetch('/api-medical/stock/stock/aggregates').then(res => res.json()),
  getBatchesByMedicineId: (medicineId: number): Promise<MedicalApiResponse<MedicineStockBatch[]>> =>
    fetch(`/api-medical/stock?medicineId=${medicineId}&activeOnly=1`).then(res => res.json()),
};

// --- 新增采购弹窗表单 ---
function ProcureMedicineModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: () => void; }) {
  const [formData, setFormData] = useState<MedicineStockDto>({
    medicine_id: 0, batch_no: '', expiration_date: '', cost_price: 0, sale_price: 0,
    quantity_in_stock: 0, minimum_stock_level: 10, location: 'A1药房', supplier: '', is_active: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        // Reset form when modal opens
        setFormData({
            medicine_id: 0, batch_no: '', expiration_date: '', cost_price: 0, sale_price: 0,
            quantity_in_stock: 0, minimum_stock_level: 10, location: 'A1药房', supplier: '', is_active: 1
        });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number' || ['medicine_id', 'cost_price', 'sale_price', 'quantity_in_stock', 'minimum_stock_level', 'is_active'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        expiration_date: new Date(formData.expiration_date).toISOString(),
      };
      const response = await apiClient.procureMedicine(submissionData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '采购入库失败' }));
        throw new Error(errorData.message);
      }
      alert('采购入库成功！');
      onSave();
    } catch (error: any) {
      console.error(error);
      alert(`操作失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>新增药品采购入库</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}><label>药品ID</label><input type="number" name="medicine_id" value={formData.medicine_id} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>批号</label><input name="batch_no" value={formData.batch_no} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>过期日期</label><input type="datetime-local" name="expiration_date" value={formData.expiration_date} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>入库数量</label><input type="number" name="quantity_in_stock" value={formData.quantity_in_stock} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>成本价</label><input type="number" name="cost_price" value={formData.cost_price} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>销售价</label><input type="number" name="sale_price" value={formData.sale_price} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>最低库存</label><input type="number" name="minimum_stock_level" value={formData.minimum_stock_level} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>位置</label><input name="location" value={formData.location} onChange={handleChange} required /></div>
            <div className={styles.formGroup}><label>供应商</label><input name="supplier" value={formData.supplier} onChange={handleChange} required /></div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>取消</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? '提交中...' : '确认入库'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- 药品批次详情弹窗 (表格已简化) ---
function BatchDetailsModal({ medicineId, isOpen, onClose }: { medicineId: number | null; isOpen: boolean; onClose: () => void; }) {
  const [batches, setBatches] = useState<MedicineStockBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && medicineId !== null) {
      const fetchBatches = async () => {
        setIsLoading(true);
        try {
          const res = await apiClient.getBatchesByMedicineId(medicineId);
          if (res.ok) {
            setBatches(res.data);
          } else {
            throw new Error(res.message || "获取批次信息失败");
          }
        } catch (error) {
          console.error("获取批次详情失败:", error);
          setBatches([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBatches();
    }
  }, [isOpen, medicineId]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.largeModal}`} onClick={e => e.stopPropagation()}>
        <h2>药品ID: {medicineId} - 库存批次详情</h2>
        {isLoading ? <p>正在加载批次信息...</p> : (
          <div className={styles.tableContainer}>
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>批号</th><th>购入数量</th><th>过期日期</th><th>供应商</th><th>位置</th>
                </tr>
              </thead>
              <tbody>
                {batches.length > 0 ? batches.map(batch => (
                  <tr key={batch.stock_batch_id}>
                    <td>{batch.batch_no}</td>
                    <td>{batch.quantity_in_stock}</td>
                    
                    <td>{new Date(batch.expiration_date).toLocaleDateString()}</td>
                    <td>{batch.supplier}</td>
                    <td>{batch.location}</td>
                  </tr>
                )) : <tr><td colSpan={6} style={{ textAlign: 'center' }}>未找到该药品的库存批次。</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className={styles.modalActions}>
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

// --- 主页面组件 ---
export function MedicineInventoryPage() {
  const [procurements, setProcurements] = useState<MedicineProcurement[]>([]);
  const [aggregatedStock, setAggregatedStock] = useState<AggregatedMedicineStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isProcureModalOpen, setIsProcureModalOpen] = useState(false);
  
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Don't set loading to true here to avoid full page re-render on sub-actions
      setError(null);
      const [procureRes, stockRes] = await Promise.all([
        apiClient.getProcurements(),
        apiClient.getAggregatedStock(),
      ]);
      if (procureRes.ok) setProcurements(procureRes.data);
      else throw new Error("获取采购预警失败");

      if (stockRes.ok) setAggregatedStock(stockRes.data);
      else throw new Error("获取库存信息失败");

    } catch (err: any) {
      setError(err.message || '数据加载失败，请稍后重试。');
      console.error(err);
    } finally {
      setIsLoading(false); // Set loading false only after all initial fetches are done
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const handleMarkAsReceived = async (procurementId: number) => {
    if (window.confirm(`确定要将采购单 ${procurementId} 标记为已入库吗？`)) {
      try {
        const response = await apiClient.markAsReceived(procurementId);
        if (!response.ok) throw new Error('更新状态失败');
        alert('状态更新成功！');
        fetchData();
      } catch (err) {
        alert('操作失败');
        console.error(err);
      }
    }
  };
  
  const handleSaveSuccess = () => {
    setIsProcureModalOpen(false);
    fetchData();
  };

  const handleViewBatches = (medicineId: number) => {
    setSelectedMedicineId(medicineId);
    setIsBatchModalOpen(true);
  };

  const pendingProcurements = procurements.filter(p => p.status === '待采购');

  if (isLoading) return <div className={styles.container}>正在加载中...</div>;
  if (error) return <div className={`${styles.container} ${styles.error}`}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1>药品库存管理</h1>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>采购预警 ({pendingProcurements.length} 条待处理)</h2>
          <button onClick={() => setIsProcureModalOpen(true)} className={styles.addButton}>+ 新增采购入库</button>
        </div>
        <div className={styles.procurementList}>
          {pendingProcurements.length > 0 ? (
            pendingProcurements.map(p => (
              <div key={p.procurement_id} className={styles.procurementItem}>
                <span>采购单ID: <strong>{p.procurement_id}</strong></span>
                <span>药品ID: <strong>{p.medicine_id}</strong></span>
                <span>需采购数量: <strong>{p.purchase_quantity}</strong></span>
                <span>创建时间: {new Date(p.purchase_time).toLocaleString()}</span>
                <button onClick={() => handleMarkAsReceived(p.procurement_id)}>标记为已入库</button>
              </div>
            ))
          ) : (
            <p>暂无待处理的采购预警。</p>
          )}
        </div>
      </div>
      
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>当前药品库存</h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.inventoryTable}>
            <thead>
              <tr>
                <th>药品ID</th>
                
                <th>可用库存</th>
                <th>活跃批次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedStock.map(stock => (
                <tr key={stock.medicine_id}>
                  <td>{stock.medicine_id}</td>
                  
                  <td>{stock.available_quantity}</td>
                  <td>{stock.active_batches}</td>
                  <td>
                    <button onClick={() => handleViewBatches(stock.medicine_id)} className={styles.actionButton}>
                      查看批次
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProcureMedicineModal 
        isOpen={isProcureModalOpen} 
        onClose={() => setIsProcureModalOpen(false)} 
        onSave={handleSaveSuccess} 
      />
      <BatchDetailsModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        medicineId={selectedMedicineId}
      />
    </div>
  );
}