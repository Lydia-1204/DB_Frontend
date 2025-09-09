// Elder service for handling API calls related to elderly records
import type { HealthAssessment, HealthMonitoring, ActivityParticipation } from '../types';

const API_BASE_URL = '/api';

export const elderlyService = {
  // 获取老人档案信息，包括健康评估
  async getElderlyRecord(elderlyId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/ElderlyRecord/${elderlyId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch elderly record: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.debug('ElderlyRecord API response:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch elderly record:', error);
      throw error;
    }
  },

  // 获取护理计划（按老人ID）并过滤状态：仅保留 Scheduled(待完成) 与 Pending(待确认)
  async getNursingPlans(elderlyId: number) {
    try {
      const res = await fetch(`/api/staff-info/nursing-plans/elderly/${elderlyId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch nursing plans: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
  if (!Array.isArray(data)) return [];
  // 严格返回原始字段，不做映射/新增/过滤
  console.debug('[NursingPlans][raw]', data);
  return data;
    } catch (e) {
      console.error('Failed to fetch nursing plans:', e);
      return [];
    }
  },

  // 取消（删除）护理计划：仅允许 Pending 状态
  async cancelNursingPlan(planId: number) {
    try {
      const url = `/api/staff-info/nursing-plans/${planId}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(()=> '');
        throw new Error(`取消护理计划失败: ${res.status} ${res.statusText} ${text}`);
      }
      console.debug('[CancelNursingPlan][success]', planId);
      return true;
    } catch (err) {
      console.error('[CancelNursingPlan][error]', err);
      throw err;
    }
  },

  /**
   * 老人端自助申请护理计划
   * 约束：
   * - staffId 置为 null
   * - careType 固定为 'Normal'
   * - evaluationStatus 固定为 'Pending'
   * - planStartDate / planEndDate 由后端（或调用方传入的不可编辑值）决定，这里默认当前时间与 +7 天
   */
  async createNursingPlan(params: { planId: number; elderlyId: number; priority: 'Low' | 'Medium' | 'High'; planStartDate?: string; planEndDate?: string }) {
    const { planId, elderlyId, priority } = params;
    const planStartDate = params.planStartDate || new Date().toISOString();
    // 默认结束时间：开始时间 + 7 天
    const planEndDate = params.planEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const body = {
      planId,
      elderlyId,
      staffId: null,
      planStartDate,
      planEndDate,
      careType: 'Normal',
      priority,
      evaluationStatus: 'Pending'
    };
    try {
      // 根据后端 OpenAPI：创建使用 POST /api/staff-info/nursing-plans，不在 URL 中放 id
      const createUrl = '/api/staff-info/nursing-plans';
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const text = await res.text();
        // 针对常见错误状态给出更明确提示
        if (res.status === 405) {
          throw new Error('创建失败：服务器不允许该方式 (405)。请确认应使用 POST /api/staff-info/nursing-plans 而不是带 ID 的路径。返回信息：' + text);
        }
        if (res.status === 409) {
          throw new Error('创建失败：计划ID可能已存在 (409)。请换一个计划ID。返回信息：' + text);
        }
        throw new Error(`Create nursing plan failed: ${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json().catch(()=> ({}));
      console.debug('[CreateNursingPlan][success]', data);
      return data;
    } catch (err) {
      console.error('[CreateNursingPlan][error]', err);
      throw err;
    }
  },

  // 获取健康监控数据
  async getHealthMonitoring(elderlyId: number): Promise<HealthMonitoring | null> {
    try {
      const elderlyRecord = await this.getElderlyRecord(elderlyId);

      // 兼容后端可能使用的不同字段命名
      const candidateKeys = [
        'monitoring',
        'healthMonitoring',
        'latestMonitoring',
  'latestHealthMonitoring',
  // 实际返回里是一个数组：healthMonitorings
  'healthMonitorings'
      ];

      let monitoring: any = null;
      for (const key of candidateKeys) {
        if (elderlyRecord && elderlyRecord[key]) {
          monitoring = elderlyRecord[key];
          console.debug(`[HealthMonitoring] Found monitoring data by key "${key}"`);
          break;
        }
      }

      // 如果抓到的是数组，取最新（按 monitoringDate / recordTime 倒序）
      if (Array.isArray(monitoring)) {
        const arr = monitoring as any[];
        if (arr.length === 0) monitoring = null; else {
          monitoring = [...arr].sort((a,b)=> new Date(b.monitoringDate || b.recordTime || 0).getTime() - new Date(a.monitoringDate || a.recordTime || 0).getTime())[0];
          console.debug('[HealthMonitoring] Selected latest item from healthMonitorings array:', monitoring);
        }
      }

      if (!monitoring) {
        console.warn('[HealthMonitoring] No monitoring field in /ElderlyRecord response, fallback to history API');
        try {
          const historyRes = await fetch(`/api/HealthMonitoring/elderly/${elderlyId}/history`);
          if (historyRes.ok) {
            const historyJson = await historyRes.json();
            if (Array.isArray(historyJson) && historyJson.length > 0) {
              const latest = historyJson[0];
              console.debug('[HealthMonitoring] Fallback latest history record:', latest);
              // 老版本字段映射：bloodPressureHigh / Low -> bloodPressure；可能无血氧，需要判空
              const bpHigh = latest.bloodPressureHigh ?? latest.systolic;
              const bpLow = latest.bloodPressureLow ?? latest.diastolic;
              const bloodPressure = (bpHigh != null && bpLow != null) ? `${bpHigh}/${bpLow}` : (latest.bloodPressure || '');
              return {
                monitoringDate: latest.recordTime || latest.monitoringDate || new Date().toISOString(),
                heartRate: Number(latest.heartRate) || 0,
                bloodPressure,
                oxygenLevel: latest.oxygenLevel != null ? Number(latest.oxygenLevel) : 0,
                temperature: Number(latest.temperature) || 0,
                status: latest.abnormalFlag ? '异常' : (latest.status || '正常')
              };
            }
          } else {
            console.warn('[HealthMonitoring] History API response not ok:', historyRes.status, historyRes.statusText);
          }
        } catch (historyErr) {
          console.error('[HealthMonitoring] Fallback history API failed:', historyErr);
        }
        return null;
      }

      // 校验必须字段，缺失则视为无效并返回 null
      const requiredFields: Array<keyof HealthMonitoring> = ['monitoringDate','heartRate','bloodPressure','oxygenLevel','temperature','status'];
      const missing = requiredFields.filter(f => monitoring[f] == null || monitoring[f] === '');
      if (missing.length) {
        console.warn('[HealthMonitoring] Monitoring object missing required fields:', missing, monitoring);
        // 尝试从组合字段生成 bloodPressure
        if (!monitoring.bloodPressure && monitoring.bloodPressureHigh != null && monitoring.bloodPressureLow != null) {
          monitoring.bloodPressure = `${monitoring.bloodPressureHigh}/${monitoring.bloodPressureLow}`;
        }
      }

      const result: HealthMonitoring = {
        monitoringDate: monitoring.monitoringDate || monitoring.recordTime || new Date().toISOString(),
        heartRate: Number(monitoring.heartRate) || 0,
        bloodPressure: monitoring.bloodPressure || (
          monitoring.bloodPressureHigh != null && monitoring.bloodPressureLow != null
            ? `${monitoring.bloodPressureHigh}/${monitoring.bloodPressureLow}`
            : ''
        ),
        oxygenLevel: monitoring.oxygenLevel != null ? Number(monitoring.oxygenLevel) : 0,
        temperature: Number(monitoring.temperature) || 0,
        status: monitoring.status || (monitoring.abnormalFlag ? '异常' : '正常')
      };

      console.debug('[HealthMonitoring] Final parsed monitoring result:', result);
      if (!result.bloodPressure) {
        console.warn('[HealthMonitoring] bloodPressure empty after parsing');
      }
      return result;
    } catch (error) {
      console.error('Failed to fetch health monitoring:', error);
      return null;
    }
  },

  // 获取健康评估数据
  async getHealthAssessments(elderlyId: number): Promise<HealthAssessment[]> {
    try {
      const elderlyRecord = await this.getElderlyRecord(elderlyId);
      const assessments = elderlyRecord.healthAssessments || [];
      console.debug('Extracted health assessments from API:', assessments);
      
      // 确保返回的数据符合 HealthAssessment 接口
      return assessments.map((assessment: any) => ({
        assessmentId: assessment.assessmentId,
        elderlyId: assessment.elderlyId,
        assessmentDate: assessment.assessmentDate,
        physicalHealthFunction: assessment.physicalHealthFunction,
        psychologicalFunction: assessment.psychologicalFunction,
        cognitiveFunction: assessment.cognitiveFunction,
        healthGrade: assessment.healthGrade
      }));
    } catch (error) {
      console.error('Failed to fetch health assessments:', error);
      return [];
    }
  },

  // 获取活动参与情况
  async getActivityParticipations(elderlyId: number): Promise<ActivityParticipation[]> {
    try {
      console.log(`elderlyService: 获取活动参与情况，老人ID: ${elderlyId}`);
      
      const response = await fetch(`/api/ActivityParticipation/by-elderly/${elderlyId}`);
      console.log('elderlyService: API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('API响应失败:', response.status, response.statusText);
        return [];
      }

      // 检查响应的Content-Type
      const contentType = response.headers.get('content-type');
      console.log('elderlyService: 响应Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('API返回的不是JSON格式，而是:', contentType);
        const text = await response.text();
        console.error('响应内容前200字符:', text.substring(0, 200));
        return [];
      }

      const data = await response.json();
      console.log('elderlyService: 成功获取活动参与数据:', data);
      
      // 确保返回的数据符合 ActivityParticipation 接口
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('获取活动参与情况失败:', error);
      return [];
    }
  }
};
