import React, { useState, useEffect } from 'react';
import type { VoiceAssistantReminder } from '../types';

interface VoiceReminderProps {
  reminders: VoiceAssistantReminder[];
  onReminderConfirm: (reminderId: string) => void;
}

export const VoiceReminder: React.FC<VoiceReminderProps> = ({ 
  reminders, 
  onReminderConfirm
}) => {
  const [activeReminder, setActiveReminder] = useState<VoiceAssistantReminder | null>(null);

  useEffect(() => {
    const checkForActiveReminders = () => {
      const now = new Date();
      const pendingReminder = reminders.find(reminder => {
        const scheduledTime = new Date(reminder.scheduledTime);
        const timeDiff = now.getTime() - scheduledTime.getTime();
        return reminder.reminderStatus === '待提醒' && 
               timeDiff >= 0 && 
               timeDiff <= 60000; // 1分钟内的提醒
      });

      if (pendingReminder && !activeReminder) {
        setActiveReminder(pendingReminder);
      }
    };

    const interval = setInterval(checkForActiveReminders, 30000); // 每30秒检查一次
    checkForActiveReminders(); // 立即检查一次

    return () => clearInterval(interval);
  }, [reminders, activeReminder]);

  const handleConfirm = () => {
    if (activeReminder) {
      onReminderConfirm(activeReminder.id);
      setActiveReminder(null);
    }
  };

  const handleDismiss = () => {
    // 本地 mock 忽略操作
    setActiveReminder(null);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case '服药': return '💊';
      case '活动': return '🎯';
      case '体检': return '🩺';
      case '用餐': return '🍽️';
      default: return '🔔';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待提醒': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case '已提醒': return 'bg-blue-50 text-blue-800 border-blue-200';
      case '已确认': return 'bg-green-50 text-green-800 border-green-200';
      case '已忽略': return 'bg-gray-50 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <>
      {/* 主动提醒弹窗 */}
      {activeReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 border-2 border-blue-200 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4 bg-blue-50 w-20 h-20 flex items-center justify-center rounded-full mx-auto border-2 border-blue-200">
                {getReminderIcon(activeReminder.reminderType)}
              </div>
              <h3 className="text-xl font-semibold text-blue-800 mb-2">语音提醒</h3>
              <p className="text-blue-600 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200">{activeReminder.content}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border-2 border-green-600 hover:border-green-700 transition-all"
                >
                  确认
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-700 transition-all"
                >
                  暂时忽略
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提醒列表 */}
      <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
          <span className="text-2xl mr-2">🔔</span>
          语音提醒
        </h3>

        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-gray-500">暂无提醒事项</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.slice(0, 5).map((reminder) => (
              <div key={reminder.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getReminderIcon(reminder.reminderType)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800">{reminder.reminderType}</h4>
                      <p className="text-sm text-gray-600">{reminder.content}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(reminder.reminderStatus)}`}>
                    {reminder.reminderStatus}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-3">
                  <span>提醒时间: {new Date(reminder.scheduledTime).toLocaleString('zh-CN')}</span>
                  {((reminder.repeatCount ?? 0) > 0) && (
                    <span className="ml-4">已重复: {reminder.repeatCount ?? 0}/{reminder.maxRepeat ?? 0} 次</span>
                  )}
                </div>

                {reminder.reminderStatus === '待提醒' && (
                  <button
                    onClick={() => onReminderConfirm(reminder.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    确认提醒
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
