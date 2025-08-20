import React, { useState, useEffect, useMemo } from 'react';
import type { EmergencySosEvent, StaffInfo,NursingPlan } from '@smart-elderly-care/types';
import styles from './NurseDashboard.module.css';

// ---------------------------
// -- 主组件
// ---------------------------

export function NurseDashboard() {
 // --- State 定义 (已清理和合并) ---
  const [allSosEvents, setAllSosEvents] = useState<EmergencySosEvent[]>([]);
  const [allNursingPlans, setAllNursingPlans] = useState<NursingPlan[]>([]);
  const [planFilter, setPlanFilter] = useState<'Scheduled' | 'Completed'>('Scheduled');
  const [currentUser, setCurrentUser] = useState<StaffInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // SOS 模态框的状态
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [selectedSosEvent, setSelectedSosEvent] = useState<EmergencySosEvent | null>(null);
  const [handlingResult, setHandlingResult] = useState('');

  // 护理计划模态框的状态
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] =  useState<NursingPlan | null>(null);

  const fetchAllData = async () => {
    if (!currentUser) return;
    try {
      const [sosResponse, plansResponse] = await Promise.all([
        fetch('/api/EmergencySOS/all'),
        fetch('/api-staff/staff-info/nursing-plans')
      ]);

      if (!sosResponse.ok) throw new Error('获取SOS事件失败');
      if (!plansResponse.ok) throw new Error('获取护理计划失败');
      
      const allSos: EmergencySosEvent[] = await sosResponse.json();
      const allPlans: NursingPlan[] = await plansResponse.json();

    // ↓↓↓↓ 监控探头 #1：查看最原始的数据 ↓↓↓↓
    console.log("【原始数据】从API获取到的所有护理计划:", allPlans);
    console.log("【原始数据】当前登录的用户信息:", currentUser);
    // ↑↑↑↑ 请在这里设置监控探头 ↑↑↑↑

      setAllSosEvents(allSos);

      // 核心修正点 #1: 使用 currentUser.staffId (小写)
      const scheduledPlans = allPlans.filter(plan => 
        plan.staffId === currentUser.staffId && plan.evaluationStatus === 'Scheduled'
      );

    // ↓↓↓↓ 监控探头 #2：查看筛选后的结果 ↓↓↓↓
    console.log("【筛选结果】筛选出的、符合条件的护理计划:", scheduledPlans);
    // ↑↑↑↑ 请在这里设置监控探头 ↑↑↑↑
      setAllNursingPlans(allPlans); 
      
      setError(null);
    } catch (err: any) {
      console.error("【捕获到错误】在 fetchAllData 中发生错误:", err); // 把错误打印出来！
      setError(err.message);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('loggedInUser');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
      const intervalId = setInterval(fetchAllData, 5000);
      return () => clearInterval(intervalId);
    }
  }, [currentUser]);

const filteredNursingPlans = useMemo(() => {
    if (!currentUser) return [];
    return allNursingPlans.filter(plan => 
      plan.staffId === currentUser.staffId && plan.evaluationStatus === planFilter
    );
  }, [allNursingPlans, currentUser, planFilter]);

// --- 派生状态 (已修正，使用新的 state 变量名) ---
  const myInProgressEvent = useMemo(() => 
    allSosEvents.find(event => 
      event.calL_STATUS === 'InProgress' && event.responsE_STAFF_ID === currentUser?.staffId
    ), 
    [allSosEvents, currentUser]
  );

  const pendingEvents = useMemo(() => 
    allSosEvents.filter(event => event.calL_STATUS === 'Pending'),
    [allSosEvents]
  );
  
  const handleAcceptSOS = async (callId: number) => {
    if (!currentUser) return alert('无法获取当前用户信息！');
    try {
      await fetch('/api/EmergencySOS/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: callId, responseStaffId: currentUser.staffId }), // 核心修正点 #2
      });
      fetchAllData();
    } catch (err: any) { alert(err.message); }
  };

  const handleCompleteSOS = async () => {
    if (!currentUser || !selectedSosEvent || !handlingResult) return alert('信息不完整！');
    try {
      await fetch('/api/EmergencySOS/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: selectedSosEvent.calL_ID,
          staffId: currentUser.staffId, // 核心修正点 #3
          handlingResult: handlingResult,
        }),
      });
      setIsSosModalOpen(false); // 关闭正确的模态框
      setHandlingResult('');
      fetchAllData();
    } catch (err: any) { alert(err.message); }
  };

  const openCompleteModal = (event: EmergencySosEvent) => {
    setSelectedSosEvent(event);
    setIsSosModalOpen(true); // 打开正确的模态框
  };
  // 打开护理计划详情模态框
const openPlanModal = (plan: NursingPlan) => {
  setSelectedPlan(plan);
  setIsPlanModalOpen(true);
};

// 标记护理计划为完成
const handleCompletePlan = async () => {
  if (!selectedPlan) return alert('未选中任何计划！');

  try {
    // 构造一个只包含新状态的更新对象
    const updatedPlanData = {
      ...selectedPlan, // 复制所有旧数据
      evaluationStatus: 'Completed' // 只修改状态
    };

    const response = await fetch(`/api-staff/staff-info/nursing-plans/${selectedPlan.planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlanData),
    });

    if (!response.ok) {
      throw new Error('更新护理计划失败');
    }

    // 更新成功后，关闭模态框并立即刷新数据
    setIsPlanModalOpen(false);
    setSelectedPlan(null);
    fetchAllData(); // 调用我们已有的数据刷新函数
    
  } catch (err: any) {
    alert(err.message);
  }
};

  // --- 渲染逻辑 (已修正) ---
  return (
    <div className={styles.dashboardContainer}>
      {myInProgressEvent ? (
        <InProgressTask event={myInProgressEvent} onCompleteClick={openCompleteModal} />
      ) : (
        <PendingAlerts events={pendingEvents} onAcceptClick={handleAcceptSOS} />
      )}
      
      <section className={styles.nursingPlanSection}>
        <div className={styles.filterControls}>
          <button 
            className={`${styles.filterButton} ${planFilter === 'Scheduled' ? styles.active : ''}`}
            onClick={() => setPlanFilter('Scheduled')}
          >
            待完成的计划
          </button>
          <button 
            className={`${styles.filterButton} ${planFilter === 'Completed' ? styles.active : ''}`}
            onClick={() => setPlanFilter('Completed')}
          >
            已完成的计划
          </button>
        </div>
        {/* ↓↓↓↓ 核心修正点：在这里传入 title 属性 ↓↓↓↓ */}
        <NursingPlanList 
          plans={filteredNursingPlans} 
          onCardClick={openPlanModal}
          title={`我的护理计划 (${planFilter})`}
          // ↓↓↓↓ 在这里传入新的属性，将父组件的状态传递给子组件 ↓↓↓↓
         filterType={planFilter}
        />
      </section>
      
      {isSosModalOpen && (
        <CompleteModal
          onClose={() => setIsSosModalOpen(false)}
          onSubmit={handleCompleteSOS}
          result={handlingResult}
          setResult={setHandlingResult}
        />
      )}
      
      {isPlanModalOpen && selectedPlan && (
        <NursingPlanModal
          plan={selectedPlan}
          onClose={() => setIsPlanModalOpen(false)}
          onComplete={handleCompletePlan}
            // ↓↓↓↓ 在这里传入新的属性 ↓↓↓↓
          // 当 planFilter 是 'Completed' 时，isCompletedView 就是 true
          isCompletedView={planFilter === 'Completed'}
        />
      )}
    </div>
  );
}

// ---------------------------
// -- 子组件：进行中的任务
// ---------------------------
function InProgressTask({ event, onCompleteClick }: { event: EmergencySosEvent, onCompleteClick: (e: EmergencySosEvent) => void }) {
  return (
    <section className={`${styles.sosSection} ${styles.inProgressCard}`}>
      <h1 className={styles.header}>我的当前任务</h1>
      <div className={styles.sosCard} style={{border: 'none', background: 'transparent'}}>
        <p><strong>老人ID:</strong> {event.elderlY_ID}</p>
        <p><strong>房间ID:</strong> {event.rooM_ID}</p>
        <p><strong>呼叫时间:</strong> {new Date(event.calL_TIME).toLocaleString()}</p>
        <p><strong>状态:</strong> 正在处理...</p>
        <div className={styles.cardActions}>
          <button className={`${styles.button} ${styles.completeBtn}`} onClick={() => onCompleteClick(event)}>
            完成处理
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------
// -- 子组件：待处理警报列表
// ---------------------------
function PendingAlerts({ events, onAcceptClick }: { events: EmergencySosEvent[], onAcceptClick: (id: number) => void }) {
  return (
    <section className={styles.sosSection}>
      <h1 className={styles.header}>实时紧急警报</h1>
      <div className={styles.sosList}>
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.calL_ID} className={styles.sosCard}>
              <p><strong>老人ID:</strong> {event.elderlY_ID}</p>
              <p><strong>房间ID:</strong> {event.rooM_ID}</p>
              <p><strong>呼叫时间:</strong> {new Date(event.calL_TIME).toLocaleString()}</p>
              <div className={styles.cardActions}>
                <button className={`${styles.button} ${styles.acceptBtn}`} onClick={() => onAcceptClick(event.calL_ID)}>
                  响应
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noSosMessage}>当前没有待处理的紧急事件。</p>
        )}
      </div>
    </section>
  );
}

// ---------------------------
// -- 子组件：完成任务的模态框
// ---------------------------
function CompleteModal({ onClose, onSubmit, result, setResult }: any) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h2>填写处理结果</h2>
        <textarea
          value={result}
          onChange={e => setResult(e.target.value)}
          placeholder="请详细描述处理过程和结果..."
        />
        <div className={styles.modalActions}>
          <button className={`${styles.button} ${styles.cancelBtn}`} onClick={onClose}>取消</button>
          <button className={`${styles.button} ${styles.completeBtn}`} onClick={onSubmit}>提交</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// -- ↓↓↓↓ 新增子组件：护理计划列表 ↓↓↓↓
// ---------------------------
// ---------------------------
// -- 子组件：护理计划列表 (已更新)
// ---------------------------
// ↓↓↓↓ 在 props 中加入 onCardClick 函数 ↓↓↓↓
function NursingPlanList({ plans, onCardClick ,title, filterType}: { plans: NursingPlan[], onCardClick: (plan: NursingPlan) => void , title: string, filterType: 'Scheduled' | 'Completed' }) {
  return (
    <section className={styles.nursingPlanSection}>
       {/* ↓↓↓↓ 使用传入的动态标题 ↓↓↓↓ */}
      <h2 className={styles.planHeader}>{title}</h2>
      <div className={styles.planList}>
        {plans.length > 0 ? (
          plans.map(plan => (
            <div key={plan.planId} className={styles.planCard} onClick={() => onCardClick(plan)}>
              <p><strong>老人ID:</strong> {plan.elderlyId}</p>
              <p><strong>护理类型:</strong> {plan.careType}</p>
              <p><strong>优先级:</strong> {plan.priority}</p>
              <p><strong>开始时间:</strong> {new Date(plan.planStartDate).toLocaleString()}</p>
              {/* ↓↓↓↓ 新增的交互按钮 ↓↓↓↓ */}
              <button className={`${styles.button} ${styles.viewPlanBtn}`}>
                {/* ↓↓↓↓ 核心修改：使用三元运算符来动态决定按钮文本 ↓↓↓↓ */}
                {filterType === 'Scheduled' ? '查看详情 / 完成' : '查看详情'}
              </button>
            </div>
          ))
        ) : (
          <p className={styles.noPlansMessage}>{`当前没有${title.includes('Scheduled') ? '待完成' : '已完成'}的护理计划。`}</p>
        )}
      </div>
    </section>
  );
}
// ---------------------------
// -- ↓↓↓↓ 新增子组件：护理计划详情模态框 ↓↓↓↓
// ---------------------------
function NursingPlanModal({ plan, onClose, onComplete,isCompletedView  }: { plan: NursingPlan, onClose: () => void, onComplete: () => void,isCompletedView: boolean  }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* ↓↓↓↓ 标题也可以根据状态动态变化 ↓↓↓↓ */}
        <h2>{isCompletedView ? '已完成计划详情' : '护理计划详情'}</h2>
        <div className={styles.planDetails}>
          <p><strong>计划 ID:</strong> {plan.planId}</p>
          <p><strong>老人 ID:</strong> {plan.elderlyId}</p>
          <p><strong>护理类型:</strong> {plan.careType}</p>
          <p><strong>优先级:</strong> {plan.priority}</p>
          <p><strong>开始时间:</strong> {new Date(plan.planStartDate).toLocaleString()}</p>
          <p><strong>结束时间:</strong> {new Date(plan.planEndDate).toLocaleString()}</p>
          <p><strong>当前状态:</strong> {plan.evaluationStatus}</p>
        </div>
        <div className={styles.modalActions}>
          <button className={`${styles.button} ${styles.cancelBtn}`} onClick={onClose}>关闭</button>
          {/* ↓↓↓↓ 核心修改：只有在非“已完成”视图下，才渲染这个按钮 ↓↓↓↓ */}
          {!isCompletedView && (
            <button className={`${styles.button} ${styles.completeBtn}`} onClick={onComplete}>
              标记为完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}