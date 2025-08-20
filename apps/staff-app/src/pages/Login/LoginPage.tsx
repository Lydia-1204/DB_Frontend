import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== '0000') {
      setError('密码不正确');
      setIsLoading(false);
      return;
    }

    try {
      // 使用我们配置好的代理路径
      const response = await fetch('/api-staff/staff-info/staff');

      if (!response.ok) {
        throw new Error('无法连接到服务器，请稍后重试。');
      }

      const allStaff: StaffInfo[] = await response.json();
      const staffIdAsNumber = parseInt(staffId, 10);

      if (isNaN(staffIdAsNumber)) {
        setError('员工ID必须是数字');
        setIsLoading(false);
        return;
      }

      const foundStaff = allStaff.find(staff => staff.staffId === staffIdAsNumber);

      if (foundStaff) {
        console.log('登录成功:', foundStaff);
        localStorage.setItem('loggedInUser', JSON.stringify(foundStaff));

        // --- 核心修改：角色判断与跳转 ---
        const position = foundStaff.position;

        if (position === 'manager') {
          navigate('/supervisor');
        } else if (position === 'Doctor') {
          navigate('/doctor');
        } else {
          // 其他所有职位都跳转到这个默认的员工界面
          navigate('/staff');
        }
        // ---------------------------------

      } else {
        setError('员工ID不存在或不匹配');
      }
    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftPanel}>
        <h1>智慧养老管理系统</h1>
        <p>科技赋能，用心服务，开启智慧养老新篇章。</p>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.loginBox}>
          <h2>欢迎回来</h2>
          <h3>员工登录</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
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
            <div className={styles.inputGroup}>
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="临时密码为 0000"
                required
              />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.button} disabled={isLoading}>
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}