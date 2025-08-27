import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { elderlyService } from '../services/elderlyService';

interface Props {
  elderlyId: number;
  onCreated?: () => void; // 创建成功回调
  onClose?: () => void;   // 关闭弹窗
}

// 老人自助申请护理计划表单
export const NursingPlanApplyForm: React.FC<Props> = ({ elderlyId, onCreated, onClose }) => {
  const [planId, setPlanId] = useState<string>('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) {
      setMessage({ type: 'error', text: '请填写计划ID' });
      return;
    }
    const numericId = Number(planId);
    if (Number.isNaN(numericId) || numericId <= 0) {
      setMessage({ type: 'error', text: '计划ID必须为正整数' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      // 先获取当前已有护理计划，前端预防重复 ID（避免后端返回 500 英文报错）
      const existing = await elderlyService.getNursingPlans(elderlyId).catch(()=> [] as any[]);
      if (Array.isArray(existing) && existing.some((p: any) => Number(p?.planId) === numericId)) {
        setMessage({ type: 'error', text: `计划ID ${numericId} 已存在，请换一个新的计划ID。` });
        setSubmitting(false);
        return;
      }
      await elderlyService.createNursingPlan({ planId: numericId, elderlyId, priority });
      setMessage({ type: 'success', text: '申请已提交，等待工作人员确认。' });
      setPlanId('');
      if (onCreated) onCreated();
    } catch (err: any) {
      // 针对可能的重复 ID 情况（服务端 409 或 500）做文案归一
      const rawMsg: string = err?.message || '';
      if (/409/.test(rawMsg) || /500/.test(rawMsg) || /Internal Server Error/i.test(rawMsg) || /已存在/.test(rawMsg) || /duplicate/i.test(rawMsg) || /exists/i.test(rawMsg) || /唯一|unique/i.test(rawMsg)) {
        setMessage({ type: 'error', text: `计划ID ${numericId} 已存在，请更换护理计划ID。` });
      } else {
        setMessage({ type: 'error', text: rawMsg || '提交失败，请稍后再试' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div 
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal-content bg-white rounded-xl shadow-2xl border-2 border-blue-200 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2">
          <h3 className="text-xl font-semibold text-blue-800 flex items-center">
            <span className="text-2xl mr-2">➕</span>申请护理计划
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-blue-700 mb-3">计划ID：</label>
            <input
              type="number"
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="请输入计划ID，如 1001"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-base font-medium text-blue-700 mb-3">优先级：</label>
            <div className="flex gap-3">
              {(['Low','Medium','High'] as const).map(p => {
                const isSelected = priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    aria-pressed={isSelected}
                    onClick={() => !submitting && setPriority(p)}
                    className={
                      `relative px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ` +
                      (isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg ring-2 ring-blue-300 scale-[1.05]'
                        : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow')
                    }
                    disabled={submitting}
                  >
                    {isSelected && <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow">✔</span>}
                    {p === 'Low' ? '低' : p === 'Medium' ? '中' : '高'}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-blue-700 mb-3">护理类型：</label>
              <input value="普通护理" disabled className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-500 text-lg" />
            </div>
            <div>
              <label className="block text-base font-medium text-blue-700 mb-3">评估状态：</label>
              <input value="待确认" disabled className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-blue-50 text-blue-500 text-lg" />
            </div>
          </div>
          
          {message && (
            <div className={`border px-4 py-3 rounded-lg ${message.type==='success'?'bg-green-50 border-green-200 text-green-700':'bg-red-50 border-red-200 text-red-700'}`}>
              <div className="flex items-center">
                <span className="text-lg mr-2">{message.type==='success'?'✅':'❌'}</span>
                <span>{message.text}</span>
              </div>
            </div>
          )}
          
          <div className="flex">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ marginRight: '32px' }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow text-sm"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default NursingPlanApplyForm;
