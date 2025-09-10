import React from 'react';
import type { MedicalOrder } from '../types';

interface MedicationReminderProps {
  medications: MedicalOrder[];
}

export const MedicationReminder: React.FC<MedicationReminderProps> = ({ medications }) => {

  const getStatusColor = (status: string) => {
    switch (status) {
      case '进行中': return 'bg-blue-50 text-blue-800 border-blue-200';
      case '已完成': return 'bg-green-50 text-green-800 border-green-200';
      case '已暂停': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getNextDoseInfo = (medication: MedicalOrder) => {
    if (medication.nextDoseTime) {
      const nextTime = new Date(medication.nextDoseTime);
      const now = new Date();
      const diffMs = nextTime.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffMs <= 0) {
        return { text: '现在应该服药', urgent: true };
      } else if (diffHours < 1) {
        return { text: `${diffMinutes}分钟后服药`, urgent: false };
      } else {
        return { text: `${diffHours}小时${diffMinutes}分钟后服药`, urgent: false };
      }
    }
    return null;
  };

  return (
  <div className="bg-white p-2 text-base h-full flex flex-col overflow-auto">
      <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-3 bg-blue-50 p-2 rounded-full">💊</span>
        用药信息
      </h3>

      {medications.length === 0 ? (
        <div className="text-center py-8 border-2 border-blue-100 rounded-lg bg-blue-50">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-blue-600">暂无用药安排</p>
        </div>
      ) : (
  <div className="space-y-4 pb-4">
          {medications.map((medication, index) => {
            const nextDose = getNextDoseInfo(medication);
            return (
              <div key={`${medication.id}-${medication.elderlyId}-${index}`} className="border-2 border-blue-100 rounded-lg p-5 bg-blue-50 hover:border-blue-300 transition-all duration-200 text-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-blue-800 text-xl leading-snug">{medication.medicineName}</h4>
                    <p className="text-blue-600 mt-1">{medication.dosage} · {medication.frequency}</p>
                  </div>
                  {/* 仅当状态不是“进行中”时显示状态徽章 */}
                  {medication.status && medication.status !== '进行中' && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${getStatusColor(medication.status)}`}>
                      {medication.status}
                    </span>
                  )}
                </div>

                {nextDose && (
                  <div className={`mb-4 p-3 rounded-lg border-2 text-base ${
                    nextDose.urgent ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-blue-700 border-blue-200'
                  }`}>
                    <span className={nextDose.urgent ? '⏰' : '📅'}></span>
                    <span className="ml-2 font-medium align-middle">{nextDose.text}</span>
                  </div>
                )}

                <div className="space-y-3 text-base bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex">
                    <span className="text-blue-600 w-24 shrink-0 font-medium">开药时间:</span>
                    <span className="text-blue-800 leading-snug">{new Date(medication.startDate).toLocaleString('zh-CN')}</span>
                  </div>
                  {medication.instructions && (
                    <div className="flex">
                      <span className="text-blue-600 w-24 shrink-0 font-medium">说明:</span>
                      <span className="text-blue-800 leading-snug">{medication.instructions}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
