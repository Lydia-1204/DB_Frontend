import React, { useState } from 'react';
import type { ActivityParticipation } from '../types';

interface ActivityCenterProps {
  participations: ActivityParticipation[];
  loading?: boolean;
}

export const ActivityCenter: React.FC<ActivityCenterProps> = ({ 
  participations, 
  loading = false 
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('全部');
  const [selectedActivity, setSelectedActivity] = useState<ActivityParticipation | null>(null);

  const statusOptions = ['全部', '已报名', '缺席', '已参加'];
  
  // 筛选活动
  const filteredParticipations = selectedStatus === '全部' 
    ? participations 
    : participations.filter(participation => participation.display_status === selectedStatus);

  // 获取状态显示样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '已报名': return 'bg-blue-100 text-blue-800 border-blue-200';
      case '已参加': return 'bg-green-100 text-green-800 border-green-200';
      case '缺席': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 获取状态显示样式（内联样式版本）
  const getStatusStyleInline = (status: string) => {
    switch (status) {
      case '已报名': 
        return { 
          backgroundColor: '#dbeafe', 
          color: '#1e40af', 
          borderColor: '#bfdbfe' 
        };
      case '已参加': 
        return { 
          backgroundColor: '#dcfce7', 
          color: '#166534', 
          borderColor: '#bbf7d0' 
        };
      case '缺席': 
        return { 
          backgroundColor: '#fee2e2', 
          color: '#dc2626', 
          borderColor: '#fecaca' 
        };
      default: 
        return { 
          backgroundColor: '#f3f4f6', 
          color: '#374151', 
          borderColor: '#d1d5db' 
        };
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case '已报名': return '📝';
      case '已参加': return '✅';
      case '缺席': return '❌';
      default: return '❓';
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateStr: string, timeStr?: string) => {
    try {
      const date = new Date(dateStr);
      const dateFormatted = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      if (timeStr) {
        // 处理时间格式 "+00 07:00:00.000000"
        const timeMatch = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes] = timeMatch;
          return `${dateFormatted} ${hours}:${minutes}`;
        }
      }
      
      return dateFormatted;
    } catch (error) {
      return dateStr;
    }
  };

  // 格式化注册时间
  const formatRegistrationTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}>
        <h2 style={{ color: '#2563eb', fontWeight: 600, marginBottom: 20 }}>活动中心</h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-500">正在加载活动参与情况...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}>
      <h2 style={{ color: '#2563eb', fontWeight: 600, marginBottom: 20 }}>活动参与情况</h2>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
              selectedStatus === status
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            {status !== '全部' && <span className="mr-1">{getStatusIcon(status)}</span>} {status}
          </button>
        ))}
      </div>

      {/* 活动参与列表 */}
      {filteredParticipations.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-gray-500">
            {selectedStatus === '全部' ? '暂无活动参与记录' : `暂无${selectedStatus}的活动记录`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {filteredParticipations.slice(0, 8).map((participation) => (
            <div
              key={participation.participation_id}
              style={{ 
                border: '1px solid #eee', 
                padding: 12, 
                borderRadius: 8, 
                minHeight: 120, 
                background: '#fff', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
              onClick={() => setSelectedActivity(participation)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#2563eb' }}>
                  {participation.activity_name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 6 }}>
                  <strong>地点：</strong>{participation.location}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 6 }}>
                  <strong>时间：</strong>{formatDateTime(participation.activity_date, participation.activity_time)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 6 }}>
                  <strong>报名：</strong>{formatRegistrationTime(participation.registration_time)}
                </div>
                {participation.check_in_time && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: 6 }}>
                    <strong>签到：</strong>{formatRegistrationTime(participation.check_in_time)}
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: 8 }}>
                <span style={{ 
                  display: 'inline-block',
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  border: '1px solid',
                  ...getStatusStyleInline(participation.display_status)
                }}>
                  <span style={{ marginRight: 4 }}>{getStatusIcon(participation.display_status)}</span>
                  {participation.display_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredParticipations.length === 0 && !loading && (
        <div style={{ marginTop: 12 }}>
          {selectedStatus === '全部' ? '暂无活动参与记录' : `暂无${selectedStatus}的活动记录`}
        </div>
      )}

      {/* 活动详情弹窗 */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold flex items-center">
                <span className="text-2xl mr-2">🎯</span>
                {selectedActivity.activity_name}
              </h4>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <strong>活动状态:</strong>
                <span className={`inline-block ml-2 text-xs px-2 py-1 rounded-full border ${getStatusStyle(selectedActivity.display_status)}`}>
                  <span className="mr-1">{getStatusIcon(selectedActivity.display_status)}</span>
                  {selectedActivity.display_status}
                </span>
                {selectedActivity.raw_status !== selectedActivity.display_status && (
                  <span className="text-xs text-gray-500 ml-2">
                    (原始状态: {selectedActivity.raw_status})
                  </span>
                )}
              </div>
              
              <p><strong>活动时间:</strong> {formatDateTime(selectedActivity.activity_date, selectedActivity.activity_time)}</p>
              <p><strong>活动地点:</strong> {selectedActivity.location}</p>
              <p><strong>报名时间:</strong> {formatRegistrationTime(selectedActivity.registration_time)}</p>
              
              {selectedActivity.check_in_time ? (
                <p><strong>签到时间:</strong> {formatRegistrationTime(selectedActivity.check_in_time)}</p>
              ) : (
                <p className="text-gray-500"><strong>签到时间:</strong> 未签到</p>
              )}
              
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p><strong>活动ID:</strong> {selectedActivity.activity_id}</p>
                <p><strong>参与记录ID:</strong> {selectedActivity.participation_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
