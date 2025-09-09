import { useState, useEffect } from 'react';
import type { 
  HealthMonitoring, 
  MedicalOrder, 
  NursingPlan, 
  ActivitySchedule, 
  DietRecommendation,
  HealthAssessment
} from '../types';
import { elderlyService } from '../services/elderlyService';

// 已移除本地 mock，失败时返回空数组并记录错误

export const useElderlyServices = (elderlyId?: number) => {
  // 使用真实登录传入的 elderlyId；若未登录则不请求
  const effectiveElderlyId = elderlyId != null ? elderlyId : 0;
  const [healthData, setHealthData] = useState<HealthMonitoring | null>(null);
  const [healthAssessments, setHealthAssessments] = useState<HealthAssessment[]>([]);
  const [medications, setMedications] = useState<MedicalOrder[]>([]);
  const [nursingPlans, setNursingPlans] = useState<NursingPlan[]>([]);
  const [activities, setActivities] = useState<ActivitySchedule[]>([]);
  const [dietPlans, setDietPlans] = useState<DietRecommendation[]>([]);
  // 语音提醒与紧急呼叫已移除
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (effectiveElderlyId) fetchAllData();
  }, [effectiveElderlyId]);

  const fetchAllData = async () => {
    setLoading(true);

    if (!effectiveElderlyId) {
      // 未提供 id：保持空数组
      setHealthData(null);
      setHealthAssessments([]);
      setMedications([]);
      setNursingPlans([]);
      setActivities([]);
      setDietPlans([]);
  // removed modules
      setLoading(false);
      return;
    }

    try {
      // 使用新的服务层获取健康监控数据
      const healthMonitoringData = await elderlyService.getHealthMonitoring(effectiveElderlyId);
      const healthAssessmentsData = await elderlyService.getHealthAssessments(effectiveElderlyId);
      
      // 其他数据的获取保持不变
      const [
        medicationsRes,
        nursingPlansData,
        activitiesRes,
        dietRes,
      ] = await Promise.all([
        fetch(`/api/medical/orders/by-elderly/${effectiveElderlyId}`),
        elderlyService.getNursingPlans(effectiveElderlyId),
        fetch(`/api/ActivityParticipation/ByElder/${effectiveElderlyId}`),
        fetch(`/api/DietRecommendation/${effectiveElderlyId}`)
      ]);

      // 调试API连接状态
      console.debug('API Response Status:', {
        healthMonitoring: healthMonitoringData ? 'success' : 'no data',
        healthAssessments: healthAssessmentsData.length,
        medications: { status: medicationsRes.status, ok: medicationsRes.ok },
  nursing: { status: Array.isArray(nursingPlansData) ? 'loaded' : 'empty', ok: true },
        activities: { status: activitiesRes.status, ok: activitiesRes.ok },
        diet: { status: dietRes.status, ok: dietRes.ok },
        // removed reminders & emergency
      });

      const [medicationsData, activitiesData, dietData] = await Promise.all([
        medicationsRes.ok ? medicationsRes.json() : Promise.resolve([]),
        activitiesRes.ok ? activitiesRes.json() : Promise.resolve([]),
        dietRes.ok ? dietRes.json() : Promise.resolve([])
      ]);

      // 设置健康监控数据
      setHealthData(healthMonitoringData);
      
      // 设置健康评估数据
      setHealthAssessments(healthAssessmentsData);
      
      // 适配新的用药返回格式 (orderId, medicineId, orderDate, dosage, frequency, duration ...)
      const mappedMedications = Array.isArray(medicationsData)
        ? medicationsData.map((m: any) => {
            return {
              id: String(m.orderId ?? m.id ?? ''),
              elderlyId: String(m.elderlyId ?? effectiveElderlyId),
              medicineName: m.medicineName || `药物ID ${m.medicineId ?? ''}`,
              dosage: m.dosage || '',
              frequency: m.frequency || '',
              startDate: m.startDate || m.orderDate || new Date().toISOString(),
              endDate: m.endDate || m.orderDate || new Date().toISOString(),
              instructions: m.instructions || m.duration || '',
              status: (m.status === '已完成' || m.status === '已暂停') ? m.status : '进行中',
              nextDoseTime: m.nextDoseTime,
              takenToday: Boolean(m.takenToday)
            };
          })
        : [];
      setMedications(mappedMedications);
  setNursingPlans(Array.isArray(nursingPlansData) ? nursingPlansData : []);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);

      // 饮食数据处理保持不变
      console.debug('Diet API raw response for elderly', effectiveElderlyId, dietData);
      
      if (!dietRes.ok) {
        console.error('Diet API failed:', {
          status: dietRes.status,
          statusText: dietRes.statusText,
          url: `/api/DietRecommendation/${effectiveElderlyId}`,
          elderlyId: effectiveElderlyId
        });
      }

      const extractArray = (raw: any): any[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (Array.isArray(raw.data)) return raw.data;
        if (Array.isArray(raw.items)) return raw.items;
        if (Array.isArray(raw.result)) return raw.result;
        return [];
      };

      const rawDietArray = extractArray(dietData);

      const parsedDietPlans: DietRecommendation[] = rawDietArray.map((d: any): DietRecommendation => {
          // recommendedFood 可能为字符串或数组
          let recommendedFoodText = '';
          if (typeof d.recommendedFood === 'string') recommendedFoodText = d.recommendedFood;
          else if (Array.isArray(d.recommendedFood)) recommendedFoodText = d.recommendedFood.join('、');
          else if (typeof d.recommendedFoods === 'string') recommendedFoodText = d.recommendedFoods;
          else if (Array.isArray(d.recommendedFoods)) recommendedFoodText = d.recommendedFoods.join('、');

          return {
            id: String(d.recommendationId ?? d.id ?? ''),
            elderlyId: String(d.elderlyId ?? effectiveElderlyId),
            mealType: '饮食建议', // 不区分早晚餐
            recommendedDate: d.recommendationDate ?? d.recommendedDate ?? new Date().toISOString(),
            foods: [], // 不使用复杂的foods结构
            totalCalories: 0,
            specialInstructions: [],
            executionStatus: (d.executionStatus === '待执行') ? '未执行' : '已执行',
            recommendedFood: recommendedFoodText || ''
          };
        });

        setDietPlans(parsedDietPlans);
  // removed modules
  setError(null);
    } catch (error) {
      console.error('Failed to fetch data, using mock fallback:', error);
  setError(error instanceof Error ? error.message : String(error));
  setHealthData(null);
  setHealthAssessments([]);
  setMedications([]);
  setNursingPlans([]);
  setActivities([]);
  setDietPlans([]);
      // removed modules
    } finally {
      setLoading(false);
    }
  };

  return {
    healthData,
    healthAssessments,
    medications,
    nursingPlans,
    activities,
    dietPlans,
    // removed: reminders, emergencyHistory
    loading,
  refetch: fetchAllData,
  error
  };
};