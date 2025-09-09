import React, { useEffect, useState } from 'react';

// 用户接口定义
interface ElderlyUser {
  elderlyId: number;
  name: string;
  gender: string;
  birthDate: string;
  idCardNumber: string;
  contactPhone: string;
  address: string;
  emergencyContact: string;
}

// 组件Props接口
interface ActivityCenterProps {
  user: ElderlyUser | null;
}

// API返回的活动类型
interface ActivitySchedule {
  activity_id: number;
  activity_name: string;
  activity_date: string;
  activity_time: string;
  location: string;
  staff_id: number;
  elderly_participants: any;
  activity_description: string;
  status: string;
}

// 报名参数类型（按照API要求的格式）
interface ParticipationKeyDto {
  activity_id: number;
  elderly_id: number;
}

// 确认弹窗Props
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: string;
}

// 确认弹窗组件
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmColor = '#2563eb'
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        minWidth: 400,
        maxWidth: 500,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: 24, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              backgroundColor: confirmColor,
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 老人参与活动项目类型
interface ElderlyParticipationItemDto {
  activity_id: number;
  activity_name?: string;
  activity_date?: string;
  // 可能还有其他字段，根据实际API返回添加
}

interface ActivityScheduleIReadOnlyListApiResponse {
  data: ActivitySchedule[];
  code: number;
  message: string;
}

const fetchActivities = async (
  from?: string,
  to?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ActivitySchedule[]> => {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));
  const res = await fetch(`/api/Activity?${params.toString()}`);
  if (!res.ok) throw new Error('获取活动失败');
  const result: ActivityScheduleIReadOnlyListApiResponse = await res.json();
  return result.data || [];
};

// 获取老人已报名的活动ID列表
const fetchElderlyParticipations = async (elderlyId: number): Promise<number[]> => {
  const res = await fetch(`/api/ActivityParticipation/by-elderly/${elderlyId}`);
  if (!res.ok) throw new Error('获取报名信息失败');
  const participations: ElderlyParticipationItemDto[] = await res.json();
  return participations.map(p => p.activity_id);
};


const ActivityCenter: React.FC<ActivityCenterProps> = ({ user }) => {
  const [activities, setActivities] = useState<ActivitySchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredActivityIds, setRegisteredActivityIds] = useState<number[]>([]);
  
  // 弹窗状态
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivitySchedule | null>(null);

  const elderlyId = user?.elderlyId;

  // 判断当前用户是否已报名该活动
  const isRegistered = (activityId: number) => {
    return registeredActivityIds.includes(activityId);
  };

  // 加载已报名活动ID列表
  const loadRegisteredActivities = async () => {
    if (!elderlyId) return;
    try {
      const participatedIds = await fetchElderlyParticipations(elderlyId);
      setRegisteredActivityIds(participatedIds);
    } catch (e: any) {
      console.error('获取报名信息失败:', e.message);
    }
  };

  // 报名
  const handleRegister = async (activity: ActivitySchedule) => {
    if (!elderlyId) return;
    setLoading(true);
    try {
      const requestBody: ParticipationKeyDto = { 
        activity_id: activity.activity_id, 
        elderly_id: elderlyId 
      };
      const res = await fetch('/api/ActivityParticipation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!res.ok) throw new Error('报名失败');
      
      // 报名成功后重新加载报名信息
      await loadRegisteredActivities();
      setError(null);
    } catch (e: any) {
      setError(e.message || '报名失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消报名
  const handleCancel = async (activity: ActivitySchedule) => {
    if (!elderlyId) return;
    setLoading(true);
    try {
      const requestBody: ParticipationKeyDto = { 
        activity_id: activity.activity_id, 
        elderly_id: elderlyId 
      };
      const res = await fetch('/api/ActivityParticipation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!res.ok) throw new Error('取消报名失败');
      
      // 取消报名成功后重新加载报名信息
      await loadRegisteredActivities();
      setError(null);
    } catch (e: any) {
      setError(e.message || '取消报名失败');
    } finally {
      setLoading(false);
    }
  };

  // 显示报名确认弹窗
  const showRegisterConfirm = (activity: ActivitySchedule) => {
    setSelectedActivity(activity);
    setShowRegisterModal(true);
  };

  // 显示取消报名确认弹窗
  const showCancelConfirm = (activity: ActivitySchedule) => {
    setSelectedActivity(activity);
    setShowCancelModal(true);
  };

  // 确认报名
  const confirmRegister = () => {
    if (selectedActivity) {
      handleRegister(selectedActivity);
    }
    setShowRegisterModal(false);
    setSelectedActivity(null);
  };

  // 确认取消报名
  const confirmCancel = () => {
    if (selectedActivity) {
      handleCancel(selectedActivity);
    }
    setShowCancelModal(false);
    setSelectedActivity(null);
  };

  // 取消弹窗
  const cancelModal = () => {
    setShowRegisterModal(false);
    setShowCancelModal(false);
    setSelectedActivity(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 同时加载活动列表和已报名活动ID
        const [activitiesData] = await Promise.all([
          fetchActivities(),
          elderlyId ? loadRegisteredActivities() : Promise.resolve()
        ]);
        
        setActivities(activitiesData.filter((a) => a.status === '报名中'));
        setError(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [elderlyId]);

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px #f0f1f2' }}>
      <h2 style={{ color: '#2563eb', fontWeight: 600, marginBottom: 20 }}>活动中心</h2>
      {loading && <div>加载中...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {activities.slice(0, 8).map((activity) => (
          <div key={activity.activity_id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, minHeight: 120, background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div><strong>活动ID：</strong>{activity.activity_id}</div>
              <div><strong>活动名称：</strong>{activity.activity_name}</div>
              <div><strong>活动日期：</strong>{activity.activity_date}</div>
              <div><strong>活动时间：</strong>{activity.activity_time}</div>
              <div><strong>地点：</strong>{activity.location}</div>
              <div><strong>活动描述：</strong>{activity.activity_description}</div>
              <div><strong>状态：</strong>{activity.status}</div>
            </div>
            {elderlyId && activity.status !== '已完成' && (
              isRegistered(activity.activity_id) ? (
                <button onClick={() => showCancelConfirm(activity)} disabled={loading} style={{ marginTop: 8, background: '#f87171', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  取消报名
                </button>
              ) : (
                <button onClick={() => showRegisterConfirm(activity)} disabled={loading} style={{ marginTop: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  报名
                </button>
              )
            )}
          </div>
        ))}
      </div>
      {activities.length === 0 && !loading && <div style={{ marginTop: 12 }}>暂无报名中的活动</div>}
      
      {/* 报名确认弹窗 */}
      <ConfirmModal
        isOpen={showRegisterModal}
        title="确认报名"
        message={`您确定要报名参加"${selectedActivity?.activity_name}"活动吗？\n\n活动时间：${selectedActivity?.activity_date} ${selectedActivity?.activity_time}\n活动地点：${selectedActivity?.location}`}
        confirmText="确认报名"
        cancelText="取消"
        onConfirm={confirmRegister}
        onCancel={cancelModal}
        confirmColor="#2563eb"
      />
      
      {/* 取消报名确认弹窗 */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="确认取消报名"
        message={`您确定要取消报名"${selectedActivity?.activity_name}"活动吗？`}
        confirmText="确认取消"
        cancelText="不取消"
        onConfirm={confirmCancel}
        onCancel={cancelModal}
        confirmColor="#f87171"
      />
    </div>
  );
};

export default ActivityCenter;
