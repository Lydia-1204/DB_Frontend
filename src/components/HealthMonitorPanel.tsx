import React from 'react';
import type { HealthMonitoring } from '../types';

interface HealthMonitorPanelProps {
  healthData: HealthMonitoring;
}

export const HealthMonitorPanel: React.FC<HealthMonitorPanelProps> = ({ 
  healthData
}) => {
  const getHealthStatusColor = (status: string) => {
    if (status === '正常') {
      return 'text-green-600 bg-green-50';
    }
    return 'text-red-600 bg-red-50';
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-CN');
  };

  // 尝试从 healthData 中读取最终评级字段（后端可能命名不同），若不存在则为 null
  const finalGrade: string | null = (healthData as any).finalGrade ?? (healthData as any).monitoringGrade ?? null;

  return (
  <div className="bg-white p-2 h-full flex flex-col overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center shrink-0">
        <span className="text-2xl mr-2">❤️</span>
        健康监测
      </h3>
      <div className="flex-1 overflow-auto pr-2">
        {/* 监测数据展示 */}
        {healthData ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            {/* 居中的评级行 */}
            <div className="mb-4 flex justify-center items-center" style={{ gap: '2rem' }}>
              <div className="text-lg font-medium text-gray-700 flex items-center" style={{ gap: '0.5rem' }}>
                <span className="font-semibold">监测评级：</span>
                <span className={`px-4 py-1.5 rounded-full text-base font-semibold tracking-wide ${getHealthStatusColor(healthData.status)}`}>
                  {healthData.status}
                </span>
              </div>
              {finalGrade && (
                <div className="text-lg font-medium text-gray-700 flex items-center" style={{ gap: '0.5rem' }}>
                  <span>最终评级：</span>
                  <span className={`px-4 py-1.5 rounded-full text-base font-semibold tracking-wide ${getHealthStatusColor(finalGrade)}`}>
                    {finalGrade}
                  </span>
                </div>
              )}
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-4">监测数据</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{healthData.heartRate}</div>
                <div className="text-sm text-gray-500">心率 (次/分)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{healthData.bloodPressure}</div>
                <div className="text-sm text-gray-500">血压 (mmHg)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{healthData.oxygenLevel}</div>
                <div className="text-sm text-gray-500">血氧 (%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{healthData.temperature}</div>
                <div className="text-sm text-gray-500">体温 (°C)</div>
              </div>
            </div>
            <div className="text-sm text-gray-500" style={{ marginTop: '2rem' }}>
              <span>监测时间：{formatTime(healthData.monitoringDate)}</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            暂无监测数据
          </div>
        )}
      </div>
    </div>
  );
};
