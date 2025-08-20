import React,{JSX} from 'react'; // 确保导入 React 以支持 JSX
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from './pages/Login/LoginPage.tsx';
import type { StaffInfo } from '@smart-elderly-care/types';
import { SupervisorLayout } from './pages/Supervisor/SupervisorLayout.tsx';
import { StaffManagementPage } from './pages/Supervisor/StaffManagementPage.tsx';
import { NursingPlanPage } from './pages/Supervisor/NursingPlanPage.tsx';
import { OperationsPage } from './pages/Supervisor/OperationsPage.tsx';
import { DisinfectionReportPage } from './pages/Supervisor/DisinfectionReportPage';

// --- 创建临时的占位页面组件 ---

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
      </Route>
      
      {/* 医生界面路由 */}
      <Route 
        path="/doctor" 
        element={<ProtectedRoute><WelcomePage role="医生" /></ProtectedRoute>} 
      />

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