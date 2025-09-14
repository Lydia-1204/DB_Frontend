import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types';
import styles from './LoginPage.module.css';

export function LoginPage() {
  // --- 无需修改的部分 ---
  const isLocalHostEnv = ['localhost','127.0.0.1'].includes(window.location.hostname);
  const portalCandidates: string[] = [
    'http://localhost:4300/',
    'http://47.96.238.102:4300/'
  ];
  const pingUrl = (url: string, timeout = 900): Promise<boolean> => new Promise(resolve => {
    let done = false; const img = new Image();
    const timer = setTimeout(()=>{ if(!done){ done=true; try{img.src='';}catch{} resolve(false);} }, timeout);
    img.onload = () => { if(!done){ done=true; clearTimeout(timer); resolve(true);} };
    img.onerror = () => { if(!done){ done=true; clearTimeout(timer); resolve(false);} };
    try { img.src = url.replace(/\/$/, '') + '/favicon.ico?_=' + Date.now(); } catch { clearTimeout(timer); resolve(false);}
  });
  const goPortal = async () => {
    if (!isLocalHostEnv) { window.location.href = portalCandidates[1] || portalCandidates[0]; return; }
    for (const c of portalCandidates) { try { if (await pingUrl(c)) { window.location.href = c; return; } } catch {} }
    window.location.href = portalCandidates[portalCandidates.length - 1];
  };

  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  // --- 新增 state: 用于控制密码的可见性 ---
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      const authResponse = await fetch('/api-staff/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stafF_ID: parseInt(staffId, 10),
          password: password,
        }),
      });

      if (authResponse.status === 401) {
        throw new Error('401');
      }

      if (!authResponse.ok) {
        throw new Error('认证服务器暂时无法连接，请稍后重试。');
      }

      const staffInfoResponse = await fetch('/api-staff/staff-info/staff');
      if (!staffInfoResponse.ok) {
        throw new Error('无法获取员工详细信息，请联系管理员。');
      }

      const allStaff: StaffInfo[] = await staffInfoResponse.json();
      const staffIdAsNumber = parseInt(staffId, 10);

      if (isNaN(staffIdAsNumber)) {
        setLoginError('员工ID必须是数字');
        setIsLoginLoading(false);
        return;
      }

      const foundStaff = allStaff.find(staff => staff.staffId === staffIdAsNumber);

      if (foundStaff) {
        console.log('登录成功，获取到详细信息:', foundStaff);
        localStorage.setItem('loggedInUser', JSON.stringify(foundStaff));

        const position = foundStaff.position;
        if (position === 'Supervisor') {
          navigate('/supervisor');
        } else if (position === 'Doctor') {
          navigate('/doctor');
        } else if (position === 'Nurse') {
          navigate('/nurse');
        } else if (position === 'Cleaner') {
          navigate('/cleaner');
        } else if (position === 'Repairman') {
          navigate('/maintenance');
        } else {
          navigate('/staff');
        }
      } else {
        throw new Error('认证成功，但无法在数据库中找到您的记录。');
      }
    } catch (err: any) {
      if (err.message === '401') {
        setLoginError('员工ID或密码错误');
      } else {
        setLoginError(err.message || '发生未知错误，请稍后重试。');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <button
        type="button"
        className={styles.returnPortalBtn}
        onClick={() => { goPortal(); }}
      >← 返回门户</button>

      <div className={styles.leftPanel}>
        <h1>智慧养老管理系统</h1>
        <p>科技赋能，用心服务，开启智慧养老新篇章。</p>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.loginBox}>
          <h2>欢迎回来</h2>
          <h3>员工登录</h3>
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="staffId">员工ID</label>
              <input
                id="staffId"
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="请输入您的员工ID"
                required
              />
            </div>
            {/* --- 这是修改的核心部分 --- */}
            <div className={styles.inputGroup}>
              <label htmlFor="password">密码</label>
              <input
                id="password"
                // 根据 showPassword 状态动态改变 input 类型
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
              {/* 点击这个 span 会切换 showPassword 的状态 */}
              <span
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* 根据状态显示不同的 Emoji 作为图标 */}
                {showPassword ? '👁️' : '🔒'}
              </span>
            </div>
            {loginError && <p className={styles.error}>{loginError}</p>}
            <button type="submit" className={styles.button} disabled={isLoginLoading}>
              {isLoginLoading ? '登录中...' : '登 录'}
            </button>
            <Link to="/change-password" className={styles.linkButton}>
                修改密码
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}