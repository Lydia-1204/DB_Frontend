import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StaffInfo } from '@smart-elderly-care/types'; // 从共享类型包中导入 StaffInfo 类型

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
      const response = await fetch('/api-staff/staff-info/staff');

      if (!response.ok) {
        throw new Error('无法连接到服务器，请稍后重试。');
      }

      // TypeScript 现在知道 allStaff 是一个 StaffInfo[] 数组
      // 并且每个元素的属性是 staffId, name 等
      const allStaff: StaffInfo[] = await response.json();

      const staffIdAsNumber = parseInt(staffId, 10);
      if (isNaN(staffIdAsNumber)) {
        setError('员工ID必须是数字');
        setIsLoading(false);
        return;
      }
      
      // 【关键修改】使用正确的小驼峰字段名进行查找
      const foundStaff = allStaff.find(staff => staff.staffId === staffIdAsNumber);

      if (foundStaff) {
        console.log('登录成功:', foundStaff);
        localStorage.setItem('loggedInUser', JSON.stringify(foundStaff));
        navigate('/dashboard');
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
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2>智慧养老系统</h2>
        <h3>员工端登录</h3>
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
  );
}