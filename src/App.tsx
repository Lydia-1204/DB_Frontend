import { useState, useEffect } from 'react';
import './App.css';
import { ElderlyDashboard } from './components/ElderlyDashboard';
import { EmergencyButton } from './components/EmergencyButton';
import { HealthAssessmentComponent } from './components/HealthAssessment';
import { MedicationReminder } from './components/MedicationReminder';
import { VoiceReminder } from './components/VoiceReminder';
import { DietPlan } from './components/DietPlan';
import { ActivityCenter } from './components/ActivityCenter';
import NursingPlanList from './components/NursingPlanList';
import NursingPlanApplyForm from './components/NursingPlanApplyForm';
import { HealthMonitorPanel } from './components/HealthMonitorPanel';
import ElderlyProfile from './components/ElderlyProfile';
import { LoginForm } from './components/LoginForm';
import { ChangePassword } from './components/ChangePassword';
import { useElderlyAuth } from './hooks/useElderlyAuth';
import { useElderlyServices } from './hooks/useElderlyServices';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNursingApply, setShowNursingApply] = useState(false);
  const { user, loading, login, logout, changePassword, updateLocalUser } = useElderlyAuth();
  
  // 只有登录用户才获取数据
  const elderlyData = useElderlyServices(user?.elderlyId);
  
  const {
    healthData,
    healthAssessments,
    medications,
    nursingPlans,
    activities,
    dietPlans,
    reminders,
    loading: dataLoading,
    error: dataError,
    refetch
  } = elderlyData;

  // 仅在客户端保留“待执行”语音提醒（老人端展示），不再调用任何语音相关后端接口
  const [pendingReminders, setPendingReminders] = useState<any[]>([]);

  const isPending = (r: any) => {
    if (!r) return false;
    // 支持多种后端字段：status / confirmed / isConfirmed / executed
    if (typeof r.status === 'string') {
      const s = r.status.toLowerCase();
      return s === 'pending' || s === '待执行' || s === '未确认';
    }
    if ('confirmed' in r) return !r.confirmed;
    if ('isConfirmed' in r) return !r.isConfirmed;
    if ('executed' in r) return !r.executed;
    // 如果没有明确字段，默认保守判断为待执行
    return true;
  };

  useEffect(() => {
    if (Array.isArray(reminders)) {
      setPendingReminders(reminders.filter(isPending));
    } else {
      setPendingReminders([]);
    }
  }, [reminders]);

  // 本地确认：仅在客户端移除/标记，不发起网络调用
  const handleReminderConfirm = (reminderId: string) => {
    setPendingReminders(prev => prev.filter(r => String(r.id) !== String(reminderId)));
  };

  // 登录处理
  const handleLogin = async (elderlyId: string, password: string): Promise<boolean> => {
    try {
      return await login(elderlyId, password);
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 修改密码处理
  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      return await changePassword(oldPassword, newPassword);
    } catch (error) {
      console.error('修改密码失败:', error);
      return false;
    }
  };

  // 退出登录
  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    setShowChangePassword(false);
  };

  // 刷新数据
  const handleRefresh = () => {
    refetch();
  };

  // 语音提醒的远程确认逻辑已移除：老人端仅在本地标记为已完成以避免调用语音接口

  // 饮食计划执行功能已移除：此系统只做显示面板

  // 处理活动报名
  const handleActivityRegister = async (activityId: string) => {
    try {
  const response = await fetch(`/api/Activity/${activityId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderlyId: user?.elderlyId
        })
      });
      
      if (response.ok) {
        console.log('活动报名成功');
        refetch();
      }
    } catch (error) {
      console.error('活动报名失败:', error);
    }
  };

  // 处理活动取消
  const handleActivityCancel = async (activityId: string) => {
    try {
  const response = await fetch(`/api/Activity/${activityId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderlyId: user?.elderlyId
        })
      });
      
      if (response.ok) {
        console.log('活动取消成功');
        refetch();
      }
    } catch (error) {
      console.error('活动取消失败:', error);
    }
  };

  // 处理紧急呼叫
  const handleEmergencyCall = async (type: string) => {
    try {
  const response = await fetch('/api/EmergencySOS/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          elderlyId: user?.elderlyId,
          callType: type
        })
      });
      
      if (response.ok) {
        console.log('紧急呼叫已发送');
        setEmergencyAlert(`紧急呼叫已成功发送！类型：${type}`);
        // 3秒后自动隐藏提醒
        setTimeout(() => {
          setEmergencyAlert(null);
        }, 3000);
        refetch();
      } else {
        setEmergencyAlert('紧急呼叫发送失败，请重试！');
        setTimeout(() => {
          setEmergencyAlert(null);
        }, 3000);
      }
    } catch (error) {
      console.error('紧急呼叫失败:', error);
      setEmergencyAlert('网络错误，紧急呼叫发送失败！');
      setTimeout(() => {
        setEmergencyAlert(null);
      }, 3000);
    }
  };

  // 等待持久化恢复
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-blue-700 text-xl">加载中...</div>;
  }

  // 如果未登录，显示登录界面
  if (!user) return <LoginForm onLogin={handleLogin} />;

  // 登录后的主界面
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white compact">
        <header className="relative bg-white shadow-md border-b-2 border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          <div className="flex justify-between items-center">
            {/* 左侧：SOS */}
            <div className="header-left flex items-center">
              <EmergencyButton inline onEmergencyCall={handleEmergencyCall} />
            </div>

            {/* 中间：居中标题（绝对定位以保持居中） */}
            <div className="header-center">
              <h1 className="text-2xl font-bold text-blue-800 header-center-title">🏥 智慧养老系统</h1>
            </div>

            {/* 右侧：用户控件 */}
            <div className="header-right flex items-center space-x-4">
              <span className="text-blue-700">欢迎，{user?.name || '老人用户'}</span>
              <button onClick={handleRefresh} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border border-blue-300 transition-colors">
                刷新
              </button>
              <button onClick={() => setShowChangePassword(true)} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 border border-yellow-300 transition-colors">
                修改密码
              </button>
              <button onClick={handleLogout} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300 transition-colors">
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 固定定位的用户控件：界面右上角（欢迎文字 + 刷新 + 修改密码 + 退出） */}
      <div className="user-controls-fixed">
        <span className="text-blue-700">欢迎，{user?.name || '老人用户'}</span>
        <button onClick={handleRefresh} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 border border-blue-300 transition-colors ml-3">
          刷新
        </button>
        <button onClick={() => setShowChangePassword(true)} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 border border-yellow-300 transition-colors ml-2">
          修改密码
        </button>
        <button onClick={handleLogout} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300 transition-colors ml-2">
          退出
        </button>
      </div>

      <nav className="bg-blue-600 shadow-md border-b-2 border-blue-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-3">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              🏠 首页
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'profile' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              👤 个人信息
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'health' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('health')}
            >
              ♥️ 健康评估
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'medication' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('medication')}
            >
              💊 用药提醒
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'voice' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('voice')}
            >
              🔊 语音提醒
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'diet' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('diet')}
            >
              🍽️ 饮食计划
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'activity' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              🎯 活动中心
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'nursing' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('nursing')}
            >
              🏥 护理安排
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'monitoring' 
                  ? 'bg-white text-blue-600 border-white shadow-md' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('monitoring')}
            >
              📊 健康监控
            </button>
            {/* SOS 已移至 header 右侧 */}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 紧急呼叫提醒 */}
        {emergencyAlert && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in-up">
            <div className={`p-4 rounded-lg shadow-lg border-2 max-w-sm ${
              emergencyAlert.includes('成功') 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              <div className="flex items-center">
                <span className="text-2xl mr-2">
                  {emergencyAlert.includes('成功') ? '✅' : '❌'}
                </span>
                <div>
                  <h4 className="font-semibold">
                    {emergencyAlert.includes('成功') ? '紧急呼叫已发送' : '紧急呼叫失败'}
                  </h4>
                  <p className="text-sm">{emergencyAlert}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid gap-6">
          {activeTab === 'dashboard' && user && (
            <ElderlyDashboard
              profile={user}
              todayMedications={medications}
              todayNursing={nursingPlans}
              latestHealth={healthData}
              todayDietCount={Array.isArray(dietPlans) ? dietPlans.length : 0}
            />
          )}
          {activeTab === 'profile' && user && (
            <ElderlyProfile user={user} updateLocalUser={updateLocalUser} />
          )}

          {activeTab === 'health' && (
            <HealthAssessmentComponent 
              assessments={healthAssessments} 
              loading={dataLoading}
              error={dataError}
            />
          )}

          {activeTab === 'medication' && (
            <MedicationReminder medications={medications} />
          )}

          {activeTab === 'voice' && (
            <VoiceReminder
              reminders={pendingReminders}
              onReminderConfirm={handleReminderConfirm}
            />
          )}

          {activeTab === 'diet' && (
            <DietPlan
              dietPlans={dietPlans}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityCenter
              activities={activities}
              onActivityRegister={handleActivityRegister}
              onActivityCancel={handleActivityCancel}
            />
          )}

          {activeTab === 'nursing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-800 flex items-center"><span className="mr-2">🏥</span>护理计划列表</h2>
                {user && (
                  <button
                    onClick={() => setShowNursingApply(true)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 border border-blue-700"
                  >
                    ➕ 申请护理计划
                  </button>
                )}
              </div>
              <NursingPlanList 
                plans={nursingPlans} 
                loading={dataLoading} 
                onCancelled={() => refetch()} 
              />
            </div>
          )}

          {activeTab === 'monitoring' && healthData && (
            <HealthMonitorPanel healthData={healthData} />
          )}

          {activeTab === 'monitoring' && !healthData && (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500">暂无健康监测数据</p>
            </div>
          )}
        </div>
      </main>
      
      {/* 全局备份 SOS 已移除，首页上方已有 SOS */}
      </div>
      
      {/* 弹窗层 - 确保在最顶层 */}
      {showChangePassword && (
        <ChangePassword 
          onChangePassword={handleChangePassword}
          onCancel={() => setShowChangePassword(false)}
        />
      )}

      {/* 护理计划申请弹窗 */}
      {showNursingApply && user && (
        <NursingPlanApplyForm
          elderlyId={user.elderlyId}
          onCreated={() => { refetch(); setShowNursingApply(false); }}
          onClose={() => setShowNursingApply(false)}
        />
      )}
    </>
  );
}

export default App;
