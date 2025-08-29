import React, { useState } from 'react';
import type { ActivitySchedule } from '../types';

interface ActivityCenterProps {
  activities: ActivitySchedule[];
  onActivityRegister: (activityId: string) => void;
  onActivityCancel: (activityId: string) => void;
}

export const ActivityCenter: React.FC<ActivityCenterProps> = ({
  activities,
  onActivityRegister,
  onActivityCancel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedActivity, setSelectedActivity] = useState<ActivitySchedule | null>(null);

  const categories = ['全部', '文娱', '健身', '康复', '社交', '教育'];
  
  const filteredActivities = selectedCategory === '全部' 
    ? activities 
    : activities.filter(activity => activity.category === selectedCategory);

  const upcomingActivities = filteredActivities.filter(activity => 
    new Date(activity.startTime) > new Date()
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '文娱': return '🎭';
      case '健身': return '🏃‍♂️';
      case '康复': return '🧘‍♀️';
      case '社交': return '👥';
      case '教育': return '📚';
      default: return '🎯';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100">
      <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
        <span className="text-2xl mr-2 bg-blue-50 p-2 rounded-full">🎯</span>
        活动中心
      </h3>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            {category !== '全部' && <span className="mr-1">{getCategoryIcon(category)}</span>} {category}
          </button>
        ))}
      </div>

      {/* 活动列表 */}
      {upcomingActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-500">暂无即将开始的活动</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingActivities.map((activity) => (
            <div
              key={activity.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(activity.category)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{activity.activityName}</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {activity.category}
                    </span>
                  </div>
                </div>
                {activity.isRegistered && (
                  <span className="text-green-600 text-xl">✅</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
              
              <div className="space-y-1 text-sm text-gray-500 mb-3">
                <p>📍 {activity.location}</p>
                <p>⏰ {new Date(activity.startTime).toLocaleDateString()} {
                  new Date(activity.startTime).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }</p>
                <p>👨‍🏫 {activity.organizer}</p>
                <p>👥 {activity.currentParticipants}/{activity.capacity}人</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedActivity(activity)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  查看详情
                </button>
                {activity.isRegistered ? (
                  <button
                    onClick={() => onActivityCancel(activity.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    取消报名
                  </button>
                ) : (
                  <button
                    onClick={() => onActivityRegister(activity.id)}
                    disabled={activity.currentParticipants >= activity.capacity}
                    className={`flex-1 px-3 py-2 rounded text-sm ${
                      activity.currentParticipants >= activity.capacity
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {activity.currentParticipants >= activity.capacity ? '已满' : '报名参加'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 活动详情弹窗 */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold flex items-center">
                <span className="text-2xl mr-2">{getCategoryIcon(selectedActivity.category)}</span>
                {selectedActivity.activityName}
              </h4>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p><strong>活动描述:</strong> {selectedActivity.description}</p>
              <p><strong>活动时间:</strong> {new Date(selectedActivity.startTime).toLocaleString()} - {new Date(selectedActivity.endTime).toLocaleString()}</p>
              <p><strong>活动地点:</strong> {selectedActivity.location}</p>
              <p><strong>组织者:</strong> {selectedActivity.organizer}</p>
              <p><strong>参与人数:</strong> {selectedActivity.currentParticipants}/{selectedActivity.capacity}人</p>
              <p><strong>活动类型:</strong> {selectedActivity.category}</p>
              
              {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                <div>
                  <strong>活动照片:</strong>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedActivity.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`活动照片 ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
