import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { BillingRecord, NursingPlan } from '../types';

interface BillingSettlementProps {
  records: BillingRecord[]; // 现有通用费用记录（可作为药品/房间等示例）
  loading?: boolean;
  elderlyId?: number; // 用于拉取/匹配护理计划
  nursingPlans?: NursingPlan[]; // 传入全部护理计划（父组件已有）
  onPaid?: (planId: number) => void; // 支付成功回调（刷新数据）
}

// 费用结算组件：三板块（护理费用/药品费用/房间费用）+ 护理计划未支付列表示例
const BillingSettlement: React.FC<BillingSettlementProps> = ({ records, loading, elderlyId, nursingPlans = [], onPaid }) => {
  const [confirmPlan, setConfirmPlan] = useState<NursingPlan | null>(null);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const unpaidPlans = (nursingPlans || []).filter(p => p.elderlyId === elderlyId && p.evaluationStatus === 'Unpaid');
  const priorityPrice: Record<string, number> = { High: 2000, Medium: 1000, Low: 500 };
  const totalUnpaid = unpaidPlans.reduce((sum, p) => sum + (priorityPrice[p.priority] || 0), 0);

  const handleConfirmPay = async () => {
    if (!confirmPlan) return;
    try {
      setPaying(true);
      // 若后端要求 staffId 不为 null，若为空则默认 1（可视后端再调整）
      const body = { ...confirmPlan, staffId: confirmPlan.staffId ?? 1, evaluationStatus: 'Completed' };
  // 使用相对路径以利用 Vite devServer 代理避免 CORS
  const res = await fetch(`/api/staff-info/nursing-plans/${confirmPlan.planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`支付失败: ${res.status} ${res.statusText} ${text}`);
      }
  setConfirmPlan(null);
  setPaySuccess(`护理计划 ${confirmPlan.planId} 支付成功`);
  // 3 秒后自动消失
  setTimeout(() => setPaySuccess(null), 3000);
      if (onPaid) onPaid(confirmPlan.planId);
    } catch (err: any) {
      alert(err?.message || '支付失败');
    } finally {
      setPaying(false);
    }
  };

  const SectionWrapper: React.FC<{ title: string; icon: string; children: React.ReactNode }>=({ title, icon, children }) => (
    <div className="bg-white p-5 rounded-xl shadow border border-blue-100">
      <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center"><span className="text-xl mr-2">{icon}</span>{title}</h4>
      {children}
    </div>
  );

  const renderRecordsTable = (list: BillingRecord[]) => (
    list.length === 0 ? <div className="text-gray-400 text-sm">暂无记录</div> : (
      <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-800">
              <th className="px-6 py-3 text-left">日期</th>
              <th className="px-6 py-3 text-left">项目</th>
              <th className="px-6 py-3 text-right">金额(元)</th>
              <th className="px-6 py-3 text-left">状态</th>
              <th className="px-6 py-3 text-left">备注</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50">
                <td className="px-6 py-3 whitespace-nowrap">{new Date(r.billingDate).toLocaleDateString('zh-CN')}</td>
                <td className="px-6 py-3">{r.item}</td>
                <td className="px-6 py-3 text-right">{r.amount.toFixed(2)}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-medium ${
                    r.status === '已支付' ? 'bg-green-50 text-green-700 border border-green-200' :
                    r.status === '未支付' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>{r.status}</span>
                </td>
                <td className="px-6 py-3 text-gray-500">{r.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
  <div className="space-y-6 text-lg md:text-xl">
      <div className="flex items-center mb-2">
        <h3 className="text-2xl font-bold text-blue-800 flex items-center"><span className="text-3xl mr-2">💰</span>费用结算</h3>
        {loading && <span className="ml-4 text-sm text-gray-500">加载中...</span>}
      </div>
      {/* 护理费用板块：展示未支付护理计划 */}
      <SectionWrapper title="护理费用" icon="🏥">
        {paySuccess && (
          <div className="mb-3 text-sm rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 shadow-sm">
            ✅ {paySuccess}
          </div>
        )}
        {unpaidPlans.length === 0 ? (
          <div className="text-gray-400 text-sm">暂无记录</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-2 text-sm font-medium text-green-700">待支付总金额：<span className="text-xl">¥{totalUnpaid}</span></div>
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
                  <th className="px-6 py-3 text-left">计划ID</th>
                  <th className="px-6 py-3 text-left">护理类型</th>
                  <th className="px-6 py-3 text-left">优先级</th>
                  <th className="px-6 py-3 text-left">开始时间</th>
                  <th className="px-6 py-3 text-left">结束时间</th>
                  <th className="px-6 py-3 text-left">金额(元)</th>
                  <th className="px-6 py-3 text-left">状态</th>
                  <th className="px-6 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {unpaidPlans.map(p => (
                  <tr key={p.planId} className="border-b last:border-b-0 hover:bg-blue-50">
                    <td className="px-6 py-3">{p.planId}</td>
                    <td className="px-6 py-3">{p.careType === 'Normal' ? '普通护理' : p.careType}</td>
                    <td className="px-6 py-3">{p.priority === 'High' ? '高' : p.priority === 'Medium' ? '中' : '低'}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{new Date(p.planStartDate).toLocaleDateString('zh-CN')}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{new Date(p.planEndDate).toLocaleDateString('zh-CN')}</td>
                    <td className="px-6 py-3 font-semibold">{priorityPrice[p.priority] || 0}</td>
                    <td className="px-6 py-3"><span className="px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">待支付</span></td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setConfirmPlan(p)}
                        className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 shadow border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={paying}
                      >去支付</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionWrapper>

      {/* 药品费用板块（使用传入 records 的一部分或全部，可根据 item 包含 '药' 过滤，这里简单展示全部示例） */}
      <SectionWrapper title="药品费用" icon="💊">
        {renderRecordsTable(records.filter(r => /药|药品|medicine/i.test(r.item)))}
      </SectionWrapper>

      {/* 房间费用板块（示例过滤 '房'） */}
      <SectionWrapper title="房间费用" icon="🛏️">
        {renderRecordsTable(records.filter(r => /房|房间|住宿|room/i.test(r.item)))}
      </SectionWrapper>

      {confirmPlan && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmPlan(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="mb-3">
              <h4 className="text-xl font-semibold text-blue-800 flex items-center"><span className="text-2xl mr-2">💳</span>确认支付</h4>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">确认支付护理计划 <strong className="text-blue-700">{confirmPlan.planId}</strong>（优先级：{confirmPlan.priority === 'High' ? '高' : confirmPlan.priority === 'Medium' ? '中' : '低'}，金额 <span className="font-semibold text-green-700">¥{priorityPrice[confirmPlan.priority]||0}</span>）吗？</p>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setConfirmPlan(null)} disabled={paying} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm disabled:opacity-50">取消</button>
                <button onClick={handleConfirmPay} disabled={paying} className="flex-1 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow text-sm">{paying ? '处理中...' : '确认支付'}</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BillingSettlement;
