import { useState } from 'react';
import './App.css';
import { ElderlyDashboard } from './components/FamilyDashboard';
// 紧急呼叫组件已移除
// 健康评估 / 用药提醒模块并入概览
// 语音提醒组件已移除
import BillingSettlement from './components/BillingSettlement';
import NoticeBoard from './components/NoticeBoard';
// 饮食计划 / 活动中心模块并入概览
import NursingPlanList from './components/NursingPlanList';
import NursingPlanApplyForm from './components/NursingPlanApplyForm';
// 健康监控模块并入概览
// 个人信息面板已移除
import { LoginForm } from './components/LoginForm';
import VisitReservation from './components/VisitReservation';
import { ChangePassword } from './components/ChangePassword';
import { useElderlyAuth } from './hooks/useElderlyAuth';
import { useElderlyServices } from './hooks/useElderlyServices';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // 紧急呼叫提醒已移除
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNursingApply, setShowNursingApply] = useState(false);
  const { user, loading, login, logout, changePassword } = useElderlyAuth();
  
  // 只有登录用户才获取数据
  const elderlyData = useElderlyServices(user?.elderlyId);
  
  const {
    healthData,
    healthAssessments,
    medications,
    nursingPlans,
    activities,
    dietPlans,
    loading: dataLoading,
  error: dataError,
    refetch
  } = elderlyData;
  // 新增：费用结算与公告占位
  const [billingRecords] = useState<any[]>([]);
  // 公告现在由 NoticeBoard 组件内部自行获取（过滤家属+全体，已发布）

  // 登录处理
  const handleLogin = async (familyId: string, password: string): Promise<boolean> => {
    try {
      return await login(familyId, password);
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
  <header className="relative bg-white border-b-2 border-blue-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          <div className="flex justify-between items-center">
            <div className="header-left flex items-center space-x-2">
              {/* 头部左侧保留空位（预约探视按钮已移到导航） */}
            </div>

            {/* 中间：居中标题（绝对定位以保持居中） */}
            <div className="header-center">
              <h1 className="text-2xl font-bold text-blue-800 header-center-title">🏥 智慧养老系统</h1>
            </div>

            {/* 右侧：用户控件 */}
            <div className="header-right flex items-center space-x-4">
              <span className="text-blue-700">欢迎，{user?.familyInfos?.find(f => f.familyId === user.familyId)?.name || user?.name || '家属用户'}</span>
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
  <span className="text-blue-700">欢迎，{user?.familyInfos?.find(f => f.familyId === user.familyId)?.name || user?.name || '家属用户'}</span>
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

  <nav className="bg-blue-600 border-b-2 border-blue-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-3">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              🏠 概览
            </button>
            {/* 个人信息面板已删除 */}
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'nursing' 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('nursing')}
            >
              🏥 护理安排
            </button>
            {/* 健康评估 / 用药提醒 / 饮食计划 / 活动中心 / 健康监控 已合并至概览 */}
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'billing' 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('billing')}
            >
              💰 费用结算
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'notice' 
                  ? 'bg-white text-blue-600 border-white' 
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('notice')}
            >
              📢 公告查看
            </button>
            {/* SOS 已移至 header 右侧 */}
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all border-2 ${
                activeTab === 'visit'
                  ? 'bg-white text-blue-600 border-white'
                  : 'text-white border-blue-500 hover:bg-blue-500 hover:border-blue-400'
              }`}
              onClick={() => setActiveTab('visit')}
            >
              🗓️ 预约探视
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
  {/* 紧急呼叫提醒已移除 */}
        
        <div className="grid gap-6">
          {activeTab === 'dashboard' && user && (
            <ElderlyDashboard
              profile={user}
              todayMedications={medications}
              latestHealth={healthData}
              healthAssessments={healthAssessments}
              activities={activities}
              dietPlansFull={dietPlans as any}
              currentFamily={user.familyInfos?.find(f => f.familyId === user.familyId) || (user.familyId ? {
                familyId: user.familyId,
                elderlyId: user.elderlyId,
                name: user.name,
                relationship: (user.familyInfos && user.familyInfos[0]?.relationship) || '家属',
                contactPhone: user.contactPhone,
                contactEmail: undefined,
                address: user.address,
                isPrimaryContact: 'Y'
              } : null)}
              onActivityRegister={handleActivityRegister}
              onActivityCancel={handleActivityCancel}
              loadingAssessments={dataLoading}
              assessmentsError={dataError}
            />
          )}
          {/* 个人信息面板已删除 */}

          {/* 健康评估 / 用药提醒 / 饮食计划 / 活动中心 已在概览中显示 */}

          {activeTab === 'nursing' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-blue-800 flex items-center"><span className="mr-2">🏥</span>护理计划列表</h2>
              <NursingPlanList 
                plans={nursingPlans} 
                loading={dataLoading} 
                onCancelled={() => refetch()} 
              />
              {user && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowNursingApply(true)}
                    className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 border border-blue-700"
                  >
                    ➕ 申请护理计划
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 健康监控已在概览中显示 */}
          {activeTab === 'billing' && (
            <BillingSettlement 
              records={billingRecords} 
              elderlyId={user?.elderlyId} 
              nursingPlans={nursingPlans} 
              onPaid={() => refetch()}
            />
          )}
          {activeTab === 'notice' && (
            <NoticeBoard familyId={user.familyId} />
          )}
          {activeTab === 'visit' && (
            <VisitReservation />
          )}
        </div>
      </main>
      
  {/* 紧急呼叫功能已完全移除 */}
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
