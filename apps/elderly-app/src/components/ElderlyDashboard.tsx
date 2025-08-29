import React from 'react';
// EmergencyButton will be rendered in the top nav (App.tsx)
import type { ElderlyProfile, MedicalOrder, NursingPlan, HealthMonitoring } from '../types';

interface ElderlyDashboardProps {
  profile: ElderlyProfile;
  todayMedications: MedicalOrder[];
  todayNursing: NursingPlan[];
  latestHealth?: HealthMonitoring | null; // 仅用于显示状态（不展示详细指标）
  todayDietCount?: number; // 今日饮食计划数量
}

export const ElderlyDashboard: React.FC<ElderlyDashboardProps> = ({
  profile,
  todayMedications,
  todayNursing,
  latestHealth,
  todayDietCount = 0
}) => {
  const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* 欢迎 + 房间（SOS 位于房间号正上方） */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-xl shadow-lg border-2 border-blue-300 welcome-card">
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4 min-w-0">
            <div className="left-meta flex flex-wrap items-center gap-6 greeting-block">
              <h2 className="greeting text-4xl mb-0 text-white">
                {new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}，{profile.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div className="welcome-right-meta text-right mb-2">
              <p className="date-line text-blue-400 mb-0">今天是 {new Date().toLocaleDateString('zh-CN')}</p>
              <p className="date-line text-blue-400 mb-0">现在时间 {currentTime}</p>
            </div>
            <div className="room-box text-right bg-white bg-opacity-20 p-2 rounded-lg border border-blue-200">
              <div className="room-label text-sm text-blue-100">联系方式</div>
              <div className="room-number text-2xl font-bold">{profile.contactPhone || profile.address || '--'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* widgets */}
      <div className="dashboard-grid">
        <div className="widget-card text-center">
          <div className="icon-placeholder text-3xl mb-2 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-full mx-auto border-2 border-blue-200">💊</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">今日用药</h3>
          <p className="text-2xl font-bold text-blue-600">{todayMedications.filter(m => !m.takenToday).length}</p>
          <p className="text-sm text-blue-500 mt-1 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">待服用</p>
        </div>

        <div className="widget-card text-center">
          <div className="icon-placeholder text-3xl mb-2 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-full mx-auto border-2 border-blue-200">🏥</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">护理服务</h3>
          {
            (() => {
              // 兼容旧版本的 status 字段与新返回的 evaluationStatus 字段
              const count = Array.isArray(todayNursing)
                ? todayNursing.filter((p: any) => {
                    if (!p) return false;
                    // 旧字段：status（中文）
                    if (typeof p.status === 'string') {
                      return p.status === '待执行' || p.status === '待完成';
                    }
                    // 新字段：evaluationStatus（英文或中文）
                    if (typeof p.evaluationStatus === 'string') {
                      const s = p.evaluationStatus;
                      return s === 'Pending' || s === 'Scheduled' || s === '待确认' || s === '待完成';
                    }
                    return false;
                  }).length
                : 0;

              return (
                <>
                  <p className="text-2xl font-bold text-green-600">{count}</p>
                  <p className="text-sm text-green-600 mt-1 px-3 py-1 bg-green-50 rounded-full border border-green-200">待完成</p>
                </>
              );
            })()
          }
        </div>

        {/* 今日饮食计划 */}
        <div className="widget-card text-center">
          <div className="icon-placeholder text-3xl mb-2 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-full mx-auto border-2 border-blue-200">🍱</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">饮食计划</h3>
          <p className="text-2xl font-bold text-purple-600">{todayDietCount}</p>
          <p className="text-sm text-purple-500 mt-1 px-3 py-1 bg-purple-50 rounded-full border border-purple-200">今日条目</p>
        </div>

        {/* 健康监测状态（只显示状态标签） */}
        <div className="widget-card text-center">
          <div className="icon-placeholder text-3xl mb-2 bg-blue-50 w-16 h-16 flex items-center justify-center rounded-full mx-auto border-2 border-blue-200">📊</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">健康监测</h3>
          <p className={`text-2xl font-bold ${latestHealth ? (latestHealth.status === '正常' ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>{latestHealth ? latestHealth.status : '--'}</p>
          <p className={`text-sm mt-1 px-3 py-1 rounded-full border ${latestHealth ? (latestHealth.status === '正常' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200') : 'text-gray-400 bg-gray-50 border-gray-200'}`}>当前状态</p>
        </div>
      </div>
    </div>
  );
};