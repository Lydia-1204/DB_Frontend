import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login/LoginPage';
import './App.css';
import React,{JSX} from 'react';

// 这是一个临时的Dashboard页面，用于登录后跳转
function Dashboard() {
  // 尝试从localStorage获取用户信息
  const userString = localStorage.getItem('loggedInUser');
  if (!userString) {
    // 如果没有用户信息，重定向回登录页
    return <Navigate to="/login" />;
  }
  const user = JSON.parse(userString);

  return (
    <div>
      <h1>欢迎, {user.name}!</h1>
      <p>你的职位是: {user.position}</p>
      <p>员工ID: {user.staffId}</p>
      {/* 在这里构建你的主界面 */}
    </div>
  );
}

// 这是一个用于检查登录状态的路由守卫组件
function ProtectedRoute({ children }: { children: JSX.Element }) {
    const user = localStorage.getItem('loggedInUser');
    return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
          path="/dashboard" 
          element={
              <ProtectedRoute>
                  <Dashboard />
              </ProtectedRoute>
          } 
      />
      {/* 默认路由，如果访问根路径，也重定向到登录页 */}
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;