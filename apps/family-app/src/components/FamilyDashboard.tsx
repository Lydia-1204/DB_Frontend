import React from 'react';
// Dashboard 仅展示各功能完整内容（已移除简略概览卡片）
import type { ElderlyProfile, MedicalOrder, HealthMonitoring, HealthAssessment, ActivityParticipation, DietRecommendation } from '../types';
import { HealthAssessmentComponent } from './HealthAssessment';
import { MedicationReminder } from './MedicationReminder';
import { DietPlan } from './DietPlan';
import { ActivityCenter } from './ActivityCenter';
import { HealthMonitorPanel } from './HealthMonitorPanel';

interface FamilyInfoLite {
  familyId: number;
  elderlyId: number;
  name: string;
  relationship: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  isPrimaryContact: string; // 'Y' | 'N'
}

interface ElderlyDashboardProps {
  profile: ElderlyProfile; // 老人信息（来自 elderlyInfo）
  todayMedications: MedicalOrder[];
  latestHealth?: HealthMonitoring | null;
  healthAssessments?: HealthAssessment[];
  activityParticipations?: ActivityParticipation[];
  dietPlansFull?: DietRecommendation[];
  currentFamily?: FamilyInfoLite | null; // 当前登录家属信息
  loadingAssessments?: boolean;
  assessmentsError?: string | null;
}

export const ElderlyDashboard: React.FC<ElderlyDashboardProps> = ({
  profile,
  todayMedications,
  latestHealth,
  healthAssessments = [],
  activityParticipations = [],
  dietPlansFull = [],
  currentFamily = null,
  loadingAssessments = false,
  assessmentsError = null
}) => {
  const currentTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* 头部信息：家属 + 老人 + 日期时间 */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* 问候语与日期时间同一行 */}
                    <div style={{ display: 'flex', alignItems: 'baseline', width: '100%', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#1e3a8a', lineHeight: 1.25, whiteSpace: 'nowrap', marginRight: '2rem' }}>
                {new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好'}，{currentFamily?.name || '家属'}
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 500, color: '#1e3a8a', lineHeight: 1.25, marginLeft: 'auto', textAlign: 'right', whiteSpace: 'nowrap' }}>
                今天是 {new Date().toLocaleDateString('zh-CN')} | 当前时间 {currentTime}
              </span>
            </div>
            {/* 精简信息：四个信息同一行横向排列 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '2.5rem', alignItems: 'center' }} className="text-lg md:text-xl text-blue-800">
                <span style={{ whiteSpace: 'nowrap' }}><span className="font-bold text-blue-900 text-lg">家属：</span> <span className="ml-1">{currentFamily?.name || '—'}</span> <span className="ml-2 text-xs text-blue-500">(ID: {currentFamily?.familyId ?? '—'})</span></span>
                <span style={{ whiteSpace: 'nowrap' }}><span className="font-bold text-blue-900 text-lg">老人：</span> <span className="ml-1">{profile.name}</span> <span className="ml-2 text-xs text-blue-500">(ID: {profile.elderlyId})</span></span>
                <span style={{ whiteSpace: 'nowrap' }}><span className="font-bold text-blue-900 text-lg">关系：</span> <span className="ml-1">{currentFamily?.relationship || '—'}</span></span>
                <span style={{ whiteSpace: 'nowrap' }}><span className="font-bold text-blue-900 text-lg">家属住址：</span> <span className="ml-1">{currentFamily?.address || '—'}</span></span>
              </div>
            </div>
          </div>
          {/* 右侧独立日期时间卡片已合并到问候语行 */}
        </div>
      </div>

  {/* 已移除概览统计卡片，仅展示下方完整内容 */}

      {/* 完整内容区：健康评估、用药、饮食、活动、监控 */}
      <div className="space-y-10 relative">
        {/* 健康评估 + 健康监测 并排 */}
        <div className="grid grid-cols-2 auto-rows-fr gap-8 mb-10 relative">
          <section id="health-assessment-section" className="h-50vh flex flex-col min-w-0 border-2 border-blue-200 rounded-xl bg-white p-4 box-border">
            <HealthAssessmentComponent assessments={healthAssessments} loading={loadingAssessments} error={assessmentsError} />
          </section>
          <section id="health-monitor-section" className="h-50vh flex flex-col min-w-0 border-2 border-blue-200 rounded-xl bg-white p-4 box-border">
            {latestHealth ? (
              <HealthMonitorPanel healthData={latestHealth} />
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100 text-center text-gray-500 h-full flex items-center justify-center">暂无健康监测数据</div>
            )}
          </section>
        </div>
        {/* 用药信息 + 饮食建议 并排 */}
        <div className="grid grid-cols-2 auto-rows-fr gap-8 mb-10 relative">
          <section id="medication-section" className="h-50vh flex flex-col min-w-0 border-2 border-blue-200 rounded-xl bg-white p-4 box-border">
            <MedicationReminder medications={todayMedications} />
          </section>
          <section id="diet-plan-section" className="h-50vh flex flex-col min-w-0 border-2 border-blue-200 rounded-xl bg-white p-4 box-border">
            <DietPlan dietPlans={dietPlansFull} />
          </section>
        </div>
        <section id="activity-center-section">
          <ActivityCenter participations={activityParticipations} loading={loadingAssessments} />
        </section>
      </div>
    </div>
  );
};