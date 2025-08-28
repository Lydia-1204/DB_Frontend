import React from 'react';
import type { DietRecommendation } from '../types';

interface DietPlanProps {
  dietPlans: DietRecommendation[];
  // 移除 onDietExecuted，此系统只做显示面板
}

export const DietPlan: React.FC<DietPlanProps> = ({ dietPlans }) => {

  // 仅显示"未执行"的饮食计划（待执行），不区分时间
  const pendingPlans = dietPlans.filter(plan => {
    return plan.executionStatus === '未执行';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已执行': return 'bg-green-50 text-green-800 border-green-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
  <div className="bg-white p-2 h-full flex flex-col overflow-auto">
      <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full">🍽️</span>
        饮食建议
      </h3>

      {pendingPlans.length === 0 ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-blue-600">暂无饮食建议</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingPlans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">🍽️</span>
                </div>
                <div className="self-start">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(plan.executionStatus)}`}>
                    {plan.executionStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="text-sm text-gray-700">
                  <strong>推荐食物:</strong>
                  <div className="mt-1 text-lg text-gray-800 leading-snug">{plan.recommendedFood || '暂无'}</div>
                </div>
                <div className="text-xs text-gray-500">
                  建议时间: {new Date(plan.recommendedDate).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

  {/* 详情弹窗已移除：此组件仅作展示 */}
    </div>
  );
};
