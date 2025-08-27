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

  return (
    <div className="bg-white pt-4 pb-6 px-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
        <span className="text-2xl mr-2">❤️</span>
        健康监测
      </h3>

      {/* 监测数据展示 */}
      {healthData ? (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-700">监测数据</h4>
            <div className={`px-4 py-1.5 rounded-full text-base font-semibold tracking-wide ${getHealthStatusColor(healthData.status)}`}>
              {healthData.status}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{healthData.heartRate}</div>
              <div className="text-sm text-gray-500">心率 (次/分)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {healthData.bloodPressure}
              </div>
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
          
          <div className="mt-4 text-sm text-gray-500">
            <span>监测时间：{formatTime(healthData.monitoringDate)}</span>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          暂无监测数据
        </div>
      )}
    </div>
  );
};
