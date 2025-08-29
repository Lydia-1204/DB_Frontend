import React from 'react';
import type { NursingPlan } from '../types';

interface NursingScheduleProps {
  nursingPlans: NursingPlan[];
}

export const NursingSchedule: React.FC<NursingScheduleProps> = ({ nursingPlans }) => {
  const todayPlans = nursingPlans; // 直接展示全部原始计划

  const mapCareType = (v?: string) => {
    if (!v) return '-';
    const m: Record<string,string> = { 'Normal':'普通护理','Emergency':'紧急护理','Special':'特殊护理' };
    return m[v] ?? v;
  };

  const mapPriority = (v?: string) => ({ 'High':'高','Medium':'中','Low':'低' }[v ?? ''] ?? v ?? '-');

  const mapEvaluation = (v?: string) => ({ 'Pending':'待确认',' Scheduled':'待完成','Completed':'已完成' }[v ?? ''] ?? v ?? '-');

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
      <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full border-2 border-blue-200">🏥</span>
        今日护理安排
      </h3>
      
      {todayPlans.length === 0 ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-blue-600">今日暂无护理安排</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayPlans.map((plan) => (
            <div key={plan.planId} className="p-4 border-2 rounded-lg bg-blue-50 border-blue-200 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col gap-2 text-sm text-blue-800">
                <div className="font-semibold">计划ID: {plan.planId}</div>
                <div>护理类型: {mapCareType(plan.careType)}</div>
                <div>优先级: {mapPriority(plan.priority)}</div>
                <div>评估状态: {mapEvaluation(plan.evaluationStatus)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
