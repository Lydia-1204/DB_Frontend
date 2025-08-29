import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getLoggedVisitor, visitorChangePassword } from '../api';

interface ChangePasswordProps {
  onCancel: () => void; // 关闭回调
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onCancel }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [visitorId, setVisitorId] = useState<number | null>(null);

  useEffect(() => {
    const v = getLoggedVisitor();
    if (v?.visitorId) setVisitorId(v.visitorId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('请填写所有密码字段');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新密码和确认密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少6位');
      return;
    }

    setLoading(true);
    setError('');

    if (!visitorId) { setError('未获取到访客ID，请重新登录'); return; }
    try {
      await visitorChangePassword(visitorId, oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => { onCancel(); }, 2000);
    } catch (err: any) {
      if (err?.status === 400) {
        setError(err?.body?.error || err?.message || '原密码错误');
      } else {
        setError(err?.message || '网络错误，请稍后重试');
      }
    } finally { setLoading(false); }
  };

  // ESC 关闭
  const escHandler = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);
  useEffect(() => {
    window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [escHandler]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
  };
  const modalStyle: React.CSSProperties = {
    width: '100%', maxWidth: 440, background: '#fff', borderRadius: 14, padding: '26px 28px 30px', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.25)', border: '1px solid #dbeafe', position: 'relative', fontFamily: 'inherit'
  };
  const titleStyle: React.CSSProperties = { margin: 0, fontSize: 20, fontWeight: 600, color: '#1e40af', textAlign: 'center' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#1d4ed8', marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 15, border: '2px solid #bfdbfe', borderRadius: 10, outline: 'none', transition: 'border-color .2s', background: '#fff' };
  const btnRowStyle: React.CSSProperties = { display: 'flex', gap: 12, marginTop: 4 };
  const smallTxt: React.CSSProperties = { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 };
  const closeBtnStyle: React.CSSProperties = { position: 'absolute', top: 8, right: 10, background: 'transparent', border: 'none', fontSize: 20, lineHeight: 1, cursor: 'pointer', color: '#64748b' };

  const renderForm = () => (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
      <div>
        <label htmlFor="oldPassword" style={labelStyle}>原密码</label>
        <input
          id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="请输入原密码"
            required
            disabled={loading || success}
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
        />
      </div>
      <div>
        <label htmlFor="newPassword" style={labelStyle}>新密码</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="至少6位"
          required
          disabled={loading || success}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" style={labelStyle}>确认新密码</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="再次输入新密码"
          required
          disabled={loading || success}
          style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#bfdbfe'}
        />
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>❌</span><span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 14px', borderRadius: 10, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✅</span><span>密码修改成功，窗口即将关闭...</span>
        </div>
      )}
      <div style={btnRowStyle}>
        <button type="button" disabled={loading} onClick={onCancel} style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>取消</button>
        <button type="submit" disabled={loading || success} style={{ flex: 1, background: '#2563eb', color: '#fff', border: '2px solid #2563eb', padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: success ? 'default' : 'pointer' }}>{loading ? '提交中...' : '确认修改'}</button>
      </div>
      <div style={smallTxt}>为了安全，建议定期更新密码。</div>
    </form>
  );

  return createPortal(
    <div style={overlayStyle} onClick={(e) => { e.stopPropagation(); }}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button aria-label="关闭" style={closeBtnStyle} onClick={onCancel}>×</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 42, marginBottom: 6 }}>🔐</div>
          <h3 style={titleStyle}>修改密码</h3>
        </div>
        {renderForm()}
      </div>
    </div>,
    document.body
  );
};
