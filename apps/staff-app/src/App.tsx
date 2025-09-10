import React,{JSX} from 'react'; // 确保导入 React 以支持 JSX
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/Login/LoginPage.tsx';
import type { StaffInfo } from '@smart-elderly-care/types';
import { ChangePasswordPage } from './pages/Login/ChangePasswordPage'; // 导入新页面

// 主管端组件
import { SupervisorLayout } from './pages/Supervisor/SupervisorLayout.tsx';
import { StaffManagementPage } from './pages/Supervisor/StaffManagementPage.tsx';
import { NursingPlanPage } from './pages/Supervisor/NursingPlanPage.tsx';
import { OperationsPage } from './pages/Supervisor/OperationsPage.tsx';
import { DisinfectionReportPage } from './pages/Supervisor/DisinfectionReportPage';
import { DeviceManagementPage } from './pages/Supervisor/DeviceManagementPage';
import { RoomManagementPage } from './pages/Supervisor/RoomManagementPage';
import { OccupancyManagementPage } from './pages/Supervisor/OccupancyManagementPage.tsx';
import { BillingRecordsPage } from './pages/Supervisor/BillingRecordsPage.tsx'; // 费用结算页面

// 护士端组件
import { NurseLayout } from './pages/Nurse/NurseLayout.tsx'; // 假设 NurseLayout 在这个路径
import { NurseDashboard } from './pages/Nurse/NurseDashboard.tsx';
import { ElderlyManagementPage } from './pages/Nurse/ElderlyManagementPage.tsx';
import { ElderlyDetailPage } from './pages/Nurse/ElderlyDetailPage.tsx'; // <--- 导入我们即将创建的详情页组件
import { DietManagementPage } from './pages/Nurse/DietManagementPage.tsx'; // <--- 导入新页面组件
import { ActivitySchedulePage } from './pages/Nurse/ActivitySchedulePage.tsx'; // <--- 1. 导入新页面组件
import { VisitorApprovalPage } from './pages/Nurse/VisitorApprovalPage.tsx'; // <--- 导入新页面组件


// 医生端组件
import { DoctorLayout } from './pages/Doctor/DoctorLayout'; 
import { DoctorDashboard } from './pages/Doctor/DoctorDashboard';

import { CleanerLayout } from './pages/Cleaner/CleanerLayout';
import { CleanerDashboard } from './pages/Cleaner/CleanerDashboard';

import { MaintenanceLayout } from './pages/Maintenance/MaintenanceLayout';
import { MaintenanceDashboard } from './pages/Maintenance/MaintenanceDashboard';

import { AnnouncementsPage } from './components/AnnouncementsPage';




// 通用的欢迎组件，用于显示用户信息和登出
function WelcomePage({ role }: { role: string }) {
  const navigate = useNavigate();
  const userString = localStorage.getItem('loggedInUser');
  
  // 如果没有用户信息，理论上 ProtectedRoute 会拦截，但这里做双重保险
  if (!userString) return <Navigate to="/login" />;
  
  const user: StaffInfo = JSON.parse(userString);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>{role} 主界面</h1>
      <h2>欢迎您, {user.name}!</h2>
      <p>您的职位是: {user.position}</p>
      <p>您的员工ID: {user.staffId}</p>
      <button onClick={handleLogout} style={{ padding: '10px 20px', marginTop: '20px' }}>
        退出登录
      </button>
      {/* 在这里构建你的具体主界面 */}
    </div>
  );
}

// --- 路由保护 ---
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem('loggedInUser');
  return user ? children : <Navigate to="/login" />;
}

// --- 主应用路由配置 ---
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* --- 主管界面路由组 --- */}
      <Route 
        path="/supervisor" 
        element={<ProtectedRoute><SupervisorLayout /></ProtectedRoute>}
      >
        {/* 默认子路由，访问/supervisor时显示 */}
        <Route index element={<Navigate to="staff" />} /> 
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="nursing-plans" element={<NursingPlanPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="disinfection-reports" element={<DisinfectionReportPage />} />
        {/* ↓↓↓↓ 在这里添加新的设备管理路由 ↓↓↓↓ */}
        <Route path="devices" element={<DeviceManagementPage />} />
        {/* ↓↓↓↓ 在这里添加新的房间管理路由 ↓↓↓↓ */}
        <Route path="rooms" element={<RoomManagementPage />} />
        {/* ↓↓↓↓ 2. 在这里为费用结算页面添加新的路由规则 ↓↓↓↓ */}
        <Route path="OccupancyManagementPage" element={<OccupancyManagementPage />} />
        {/* ↓↓↓↓ 集成公告页，并传入角色 'supervisor' ↓↓↓↓ */}
        <Route path="announcements" element={<AnnouncementsPage role="supervisor" />} />
        <Route path="billing-records" element={<BillingRecordsPage />} />
      </Route>
      
      {/* --- 医生端路由 --- */}
      <Route path="/doctor" element={<ProtectedRoute><DoctorLayout /></ProtectedRoute>}>
        <Route index element={<DoctorDashboard />} />
        {/* 老人管理列表页 (复用组件) */}
        <Route path="elderly-management" element={<ElderlyManagementPage role="doctor" />} />
        <Route path="elderly-management/:elderlyId" element={<ElderlyDetailPage />} />
        {/* ↓↓↓↓ 修正：为医生端也加上详情页路由！↓↓↓↓ */}
        <Route path="elderly-management/:elderlyId" element={<ElderlyDetailPage />} />
        {/* ↓↓↓↓ 集成公告页，并传入角色 'doctor' ↓↓↓↓ */}
        <Route path="announcements" element={<AnnouncementsPage role="doctor" />} />
        
      </Route>

      {/* ↓↓↓↓ 我们在这里添加护士端的路由规则 ↓↓↓↓ */}
      <Route path="/nurse" element={<ProtectedRoute><NurseLayout /></ProtectedRoute>}>
        {/* index 路由，访问 /nurse 时默认显示 */}
        <Route index element={<NurseDashboard />} />
        
        {/* 老人管理列表页 */}
        <Route path="elderly-management" element={<ElderlyManagementPage role="nurse" />} />
        {/* ↓↓↓↓ 修正：将详情页路由加回来！↓↓↓↓ */}
        <Route path="elderly-management/:elderlyId" element={<ElderlyDetailPage />} />
  {/* ↓↓↓↓ 新增的饮食管理页面的路由 ↓↓↓↓ */}
  <Route path="diet-management" element={<DietManagementPage />} />
  <Route path="activity-schedule" element={<ActivitySchedulePage />} />
  {/* ↓↓↓↓ 新增的访客审批页面的路由 ↓↓↓↓ */}
  <Route path="visitor-approval" element={<VisitorApprovalPage />} />
  {/* ↓↓↓↓ 集成公告页，并传入角色 'nurse' ↓↓↓↓ */}
        <Route path="announcements" element={<AnnouncementsPage role="nurse" />} />

        {/* 其他护士子路由可以继续在这里添加... */}
      </Route>

     {/* ↓↓↓ 更新清洁工的路由规则 ↓↓↓ */}
      <Route path="/cleaner" element={<ProtectedRoute><CleanerLayout /></ProtectedRoute>}>
        {/* 访问 /cleaner 时，默认显示工作台 */}
        <Route index element={<CleanerDashboard />} /> 
        {/* ↓↓↓↓ 集成公告页，并传入角色 'cleaner' ↓↓↓↓ */}
        <Route path="announcements" element={<AnnouncementsPage role="cleaner" />} />
      </Route>

      {/* ↓↓↓ 更新维修工的路由规则 ↓↓↓ */}
      <Route path="/maintenance" element={<ProtectedRoute><MaintenanceLayout /></ProtectedRoute>}>
        {/* 访问 /maintenance 时，默认显示工作台 */}
        <Route index element={<MaintenanceDashboard />} />
        {/* ↓↓↓↓ 集成公告页，并传入角色 'maintenance' ↓↓↓↓ */}
        <Route path="announcements" element={<AnnouncementsPage role="maintenance" />} />
      </Route>

      {/* 普通员工界面路由 */}
      <Route 
        path="/staff" 
        element={<ProtectedRoute><WelcomePage role="员工" /></ProtectedRoute>} 
      />
      
      {/* 默认路由，如果访问根路径，重定向到登录页 */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* 其他所有未匹配的路径也重定向到登录页 */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;