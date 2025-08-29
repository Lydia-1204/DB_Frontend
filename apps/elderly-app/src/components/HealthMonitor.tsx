import React from 'react';
import type { HealthMonitoring } from '../types';

interface HealthMonitorProps {
  healthData: HealthMonitoring;
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({ healthData }) => {
  const getHealthStatusColor = (status: string) => {
    if (status === '正常') {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getVitalSignColor = (value: number, range: { min: number; max: number }) => {
    if (value < range.min || value > range.max) {
      return 'text-red-600';
    }
    return 'text-green-600';
  };

  // 解析血压值
  const parseBloodPressure = (bloodPressure: string) => {
    const [systolic, diastolic] = bloodPressure.split('/').map(Number);
    return { systolic, diastolic };
  };

  const bloodPressure = parseBloodPressure(healthData.bloodPressure);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-blue-800 flex items-center">
          <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full border-2 border-blue-200">❤️</span>
          健康监测
        </h3>
      </div>

      {!healthData ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-blue-600">暂无健康数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 监测数据 */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-blue-800">健康监测数据</h4>
              <span className={`font-medium px-3 py-1 rounded-full border-2 ${getHealthStatusColor(healthData.status)}`}>
                {healthData.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center bg-white p-3 rounded-lg border-2 border-blue-100">
                <p className="text-sm text-blue-600 font-medium">心率</p>
                <p className={`text-xl font-bold ${getVitalSignColor(healthData.heartRate, { min: 60, max: 100 })}`}>
                  {healthData.heartRate}
                </p>
                <p className="text-xs text-blue-400">bpm</p>
              </div>
              
              <div className="text-center bg-white p-3 rounded-lg border-2 border-blue-100">
                <p className="text-sm text-blue-600 font-medium">血压</p>
                <p className={`text-xl font-bold ${
                  getVitalSignColor(bloodPressure.systolic, { min: 90, max: 140 }) === 'text-red-600' ||
                  getVitalSignColor(bloodPressure.diastolic, { min: 60, max: 90 }) === 'text-red-600'
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {healthData.bloodPressure}
                </p>
                <p className="text-xs text-blue-400">mmHg</p>
              </div>
              
              <div className="text-center bg-white p-3 rounded-lg border-2 border-blue-100">
                <p className="text-sm text-blue-600 font-medium">血氧</p>
                <p className={`text-xl font-bold ${getVitalSignColor(healthData.oxygenLevel, { min: 95, max: 100 })}`}>
                  {healthData.oxygenLevel}
                </p>
                <p className="text-xs text-blue-400">%</p>
              </div>
              
              <div className="text-center bg-white p-3 rounded-lg border-2 border-blue-100">
                <p className="text-sm text-blue-600 font-medium">体温</p>
                <p className={`text-xl font-bold ${getVitalSignColor(healthData.temperature, { min: 36.1, max: 37.2 })}`}>
                  {healthData.temperature}
                </p>
                <p className="text-xs text-blue-400">°C</p>
              </div>
            </div>
            
            <p className="text-sm text-blue-600 mt-3 text-center bg-white p-2 rounded border border-blue-200">
              监测时间: {new Date(healthData.monitoringDate).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
