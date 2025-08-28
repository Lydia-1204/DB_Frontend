import React from 'react';
import type { RawNursingPlan as NursingPlan } from '../types';

interface Props {
  plans: NursingPlan[];
  loading?: boolean;
  onCancelled?: (planId: number) => void; // 取消成功后回调（刷新父级）
}

// 严格显示后端原始字段：planId elderlyId staffId planStartDate planEndDate careType priority evaluationStatus
const NursingPlanList: React.FC<Props> = ({ plans, loading, onCancelled }) => {
  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow border border-blue-100">加载中...</div>;
  }

  const mapCareType = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { Normal: '普通护理', Emergency: '紧急护理' };
    return m[v] ?? v;
  };
  const mapPriority = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { High: '高', Medium: '中', Low: '低' };
    return m[v] ?? v;
  };
  const mapEvaluation = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { Unpaid: '待支付', Pending: '待确认', Scheduled: '待完成', Completed: '已完成' };
    return m[v] ?? v;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
      <h3 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full border-2 border-blue-200">📝</span>
        护理计划
      </h3>
      {plans.length === 0 ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50 text-blue-600">暂无待完成或待确认护理计划</div>
      ) : (
        <div className="overflow-x-auto border-2 border-blue-200 rounded-lg shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-50 border-b-2 border-blue-300">
              <tr>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">计划ID</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">老人ID</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">员工ID</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">护理类型</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">优先级</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700 border-r border-blue-200">评估状态</th>
                <th className="px-4 py-3 text-left text-lg md:text-xl font-medium text-blue-700">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {plans.filter(p => ['Pending','Scheduled','待确认','待完成'].includes(p.evaluationStatus)).map((p, index) => (
                <tr
                  key={p.planId}
                  className={`hover:bg-blue-50/70 border-b border-blue-200 ${index % 2 === 0 ? 'bg-blue-25' : 'bg-white'}`}
                  style={{
                    boxShadow: index < plans.length - 1 ? '0 1px 0 0 rgba(59, 130, 246, 0.2)' : 'none',
                    borderLeft: `4px solid ${p.priority === 'High' ? '#ef4444' : p.priority === 'Medium' ? '#f59e0b' : '#10b981'}`
                  }}
                >
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 font-mono border-r border-blue-100">{p.planId}</td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 border-r border-blue-100">{p.elderlyId}</td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 border-r border-blue-100">{p.staffId == null ? '无' : String(p.staffId)}</td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 border-r border-blue-100">{mapCareType(p.careType)}</td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 border-r border-blue-100">
                    <span className={`px-2 py-1 rounded-full text-base md:text-lg font-medium ${
                      p.priority === 'High' ? 'bg-red-100 text-red-800' :
                      p.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {mapPriority(p.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900 border-r border-blue-100">
                    <span className={`px-2 py-1 rounded-full text-base md:text-lg font-medium ${
                      p.evaluationStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                      p.evaluationStatus === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {mapEvaluation(p.evaluationStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lg md:text-xl text-blue-900">
                    {p.evaluationStatus === 'Pending' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm(`确认取消护理计划 ${p.planId} ?`)) return;
                          try {
                            const { elderlyService } = await import('../services/elderlyService');
                            await elderlyService.cancelNursingPlan(p.planId);
                            if (onCancelled) onCancelled(p.planId);
                          } catch (err: any) {
                            alert(err?.message || '取消失败');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm md:text-base bg-red-600 hover:bg-red-700 text-white font-medium shadow border border-red-700"
                      >取消</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NursingPlanList;
