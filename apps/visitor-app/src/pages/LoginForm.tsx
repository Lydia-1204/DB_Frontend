import { useState } from 'react';
import { visitorLogin, visitorRegister } from '../api';

interface LoginFormProps {
  onSuccess?: () => void; // 可选登录成功回调
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorPassword, setVisitorPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const validate = () => {
    if (mode === 'login') {
      if (!visitorPhone.trim()) return '请输入手机号';
      if (!/^\d{6,20}$/.test(visitorPhone.trim())) return '手机号格式不正确 (6-20位数字)';
      if (!visitorPassword.trim()) return '请输入密码';
    } else {
      if (!registerName.trim()) return '请输入姓名';
      if (registerName.trim().length > 50) return '姓名最多50字符';
      if (!registerPhone.trim()) return '请输入手机号';
      if (!/^\d{6,20}$/.test(registerPhone.trim())) return '手机号格式不正确 (6-20位数字)';
      if (!registerPassword.trim()) return '请输入密码';
      if (registerPassword.trim().length > 100) return '密码最多100字符';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      if (mode === 'login') {
        const data = await visitorLogin(visitorPhone.trim(), visitorPassword);
        if (data?.visitorId) {
          setSuccessMsg('登录成功');
          if (onSuccess) onSuccess();
        } else {
          setError('登录失败，请检查手机号和密码');
        }
      } else {
        const data = await visitorRegister({
          visitorName: registerName.trim(),
          visitorPhone: registerPhone.trim(),
          visitorPassword: registerPassword.trim()
        });
        if (data?.visitorId) {
          setSuccessMsg('注册成功，请使用手机号登录');
          // 自动填充登录手机号并切换模式
          setVisitorPhone(registerPhone.trim());
          setMode('login');
        } else {
          setError('注册失败');
        }
      }
    } catch (err: any) {
      if (err?.status === 400) {
        setError(err?.body?.error || err?.message || (mode === 'login' ? '手机号或密码错误' : '手机号已注册'));
      } else {
        setError(err?.message || '网络错误，请稍后重试');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* 将卡片限制为较窄宽度并水平居中 */}
      <div style={{
        backgroundColor: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '2px solid #93c5fd',
        width: '100%',
        maxWidth: '36rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ alignSelf: 'flex-end', width: '100%', display:'flex', justifyContent:'flex-end', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { window.location.href = ((import.meta as any).env?.VITE_PORTAL_URL) || 'http://localhost:4300/'; }}
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid #93c5fd',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '0.9rem',
              lineHeight: 1.2,
              padding: '.4rem .75rem',
              borderRadius: '.55rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.35rem',
              transition: 'all .18s ease'
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget; t.style.background = '#2563eb'; t.style.color = '#fff'; t.style.borderColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget; t.style.background = 'rgba(255,255,255,0.55)'; t.style.color = '#2563eb'; t.style.borderColor = '#93c5fd';
            }}
          >← 返回门户</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e40af', letterSpacing: '0.025em', margin: 0 }}>智慧养老系统</h2>
          <p style={{ color: '#2563eb', fontSize: '1.125rem', marginTop: '0.5rem', margin: 0 }}>{mode === 'login' ? '访客端登录' : '访客账号注册'}</p>
        </div>

        {/* 居中列 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '32rem' }}>
          {mode === 'login' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <label htmlFor="visitorPhone" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>
              手机号：
            </label>
            <input
              type="tel"
              id="visitorPhone"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              required
              placeholder="请输入手机号"
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1.125rem',
                border: '2px solid #93c5fd',
                borderRadius: '0.75rem',
                outline: 'none',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              disabled={loading}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
            />
          </div>)}

            {mode === 'login' && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <label htmlFor="visitorPassword" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>
                密码：
              </label>
              <input
                type="password"
                id="visitorPassword"
                value={visitorPassword}
                onChange={(e) => setVisitorPassword(e.target.value)}
                required
                placeholder="请输入密码"
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  fontSize: '1.125rem',
                  border: '2px solid #93c5fd',
                  borderRadius: '0.75rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                disabled={loading}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
              />
            </div>)}

            {mode === 'register' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <label htmlFor="registerName" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>姓名：</label>
                  <input
                    id="registerName"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    placeholder="请输入姓名"
                    style={{ width: '100%', padding: '1rem 1.5rem', fontSize: '1.125rem', border: '2px solid #93c5fd', borderRadius: '0.75rem', outline: 'none', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    disabled={loading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <label htmlFor="registerPhone" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>手机号：</label>
                  <input
                    id="registerPhone"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    required
                    placeholder="请输入手机号"
                    style={{ width: '100%', padding: '1rem 1.5rem', fontSize: '1.125rem', border: '2px solid #93c5fd', borderRadius: '0.75rem', outline: 'none', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    disabled={loading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <label htmlFor="registerPassword" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>密码：</label>
                  <input
                    id="registerPassword"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    placeholder="请输入密码"
                    style={{ width: '100%', padding: '1rem 1.5rem', fontSize: '1.125rem', border: '2px solid #93c5fd', borderRadius: '0.75rem', outline: 'none', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                    disabled={loading}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                  />
                </div>
              </>
            )}

            {(error || successMsg) && (
              <div style={{
                width: '100%',
                backgroundColor: error ? '#fef2f2' : '#ecfdf5',
                border: error ? '1px solid #fecaca' : '1px solid #a7f3d0',
                color: error ? '#dc2626' : '#047857',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                textAlign: 'center',
                fontSize: '1.125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>{error ? '❌' : '✅'}</span>
                  <span>{error || successMsg}</span>
                </div>
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  border: '2px solid #2563eb',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#1d4ed8';
                    target.style.borderColor = '#1d4ed8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = '#2563eb';
                    target.style.borderColor = '#2563eb';
                  }
                }}
              >
                {loading ? (mode === 'login' ? '登录中...' : '注册中...') : (mode === 'login' ? '登录' : '注册')}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => { setError(''); setSuccessMsg(''); setMode(mode === 'login' ? 'register' : 'login'); }}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: '2px solid #93c5fd',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
              </button>
            </div>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '1rem', color: '#2563eb', letterSpacing: '0.025em' }}>
          <p style={{ margin: 0 }}>{mode === 'login' ? '💡 提示：请输入手机号与密码进行登录' : '💡 提示：注册后请妥善保管您的密码'}</p>
        </div>
      </div>
    </div>
  );
};
