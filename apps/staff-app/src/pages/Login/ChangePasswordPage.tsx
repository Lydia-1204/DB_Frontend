import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './ChangePasswordPage.module.css'; // 我们将创建这个样式文件

export function ChangePasswordPage() {
  const [staffId, setStaffId] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const staffIdAsNumber = parseInt(staffId, 10);
      if (isNaN(staffIdAsNumber)) {
        setError('员工ID必须是数字');
        return;
      }

      const response = await fetch('/api-staff/Auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stafF_ID: staffIdAsNumber,
          oldPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      // 假设即使失败，API也会返回JSON
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '密码修改失败，请检查输入信息。');
      }

      setSuccess('密码修改成功！现在您可以返回登录了。');
      // 成功后清空表单
      setStaffId('');
      setOldPassword('');
      setNewPassword('');

    } catch (err: any) {
      setError(err.message || '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.changePasswordBox}>
        <h2>修改密码</h2>
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
            <label htmlFor="oldPassword">旧密码</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入您的旧密码"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">新密码</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入您的新密码"
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? '提交中...' : '确认修改'}
          </button>
          <Link to="/" className={styles.linkButton}>
            返回登录
          </Link>
        </form>
      </div>
    </div>
  );
}