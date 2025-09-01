import { useState } from 'react';

// 统一“返回门户”跳转逻辑：
// 本地环境(hostname 为 localhost/127.0.0.1) 下：按顺序尝试候选地址(先 localhost:4300 再远程)并用图片 ping 探测；
// 远程访问时：直接跳转远程候选；
const isLocalHostEnv = ['localhost','127.0.0.1'].includes(window.location.hostname);
const portalCandidates: string[] = [
  'http://localhost:4300/',
  'http://47.96.238.102:4300/'
];
const pingUrl = (url: string, timeout = 900): Promise<boolean> => new Promise(resolve => {
  let done = false;
  const img = new Image();
  const timer = setTimeout(() => { if (!done) { done = true; try { img.src = ''; } catch {} resolve(false); } }, timeout);
  img.onload = () => { if (!done) { done = true; clearTimeout(timer); resolve(true); } };
  img.onerror = () => { if (!done) { done = true; clearTimeout(timer); resolve(false); } };
  try { img.src = url.replace(/\/$/, '') + '/favicon.ico?_=' + Date.now(); } catch { clearTimeout(timer); resolve(false); }
});
const goPortal = async () => {
  if (!isLocalHostEnv) { // 远程直接跳远程
    window.location.href = portalCandidates[1] || portalCandidates[0];
    return;
  }
  for (const c of portalCandidates) {
    try { if (await pingUrl(c)) { window.location.href = c; return; } } catch {}
  }
  window.location.href = portalCandidates[portalCandidates.length - 1];
};

interface LoginFormProps {
  onLogin: (elderlyId: string, password: string) => Promise<boolean>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [elderlyId, setElderlyId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!elderlyId.trim() || !password.trim()) {
      setError('请输入老人ID和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await onLogin(elderlyId.trim(), password);
      
      if (!success) {
        setError('登录失败，请检查老人ID和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
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
            onClick={() => { goPortal(); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '.25rem'
            }}
          >← 返回门户</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e40af', letterSpacing: '0.025em', margin: 0 }}>智慧养老系统</h2>
          <p style={{ color: '#2563eb', fontSize: '1.125rem', marginTop: '0.5rem', margin: 0 }}>老人端登录</p>
        </div>

        {/* 居中列 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', width: '100%', maxWidth: '32rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <label htmlFor="elderlyId" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>
              老人ID：
            </label>
            <input
              type="text"
              id="elderlyId"
              value={elderlyId}
              onChange={(e) => setElderlyId(e.target.value)}
              required
              placeholder="请输入老人ID"
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
          </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <label htmlFor="password" style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: '600', color: '#1d4ed8', textAlign: 'center' }}>
                密码：
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && (
              <div style={{
                width: '100%',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                textAlign: 'center',
                fontSize: '1.125rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

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
              {loading ? '登录中...' : '登录'}
            </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '1rem', color: '#2563eb', letterSpacing: '0.025em' }}>
          <p style={{ margin: 0 }}>💡 提示：请输入您的老人ID和密码进行登录</p>
        </div>
      </div>
    </div>
  );
};
