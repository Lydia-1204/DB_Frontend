// 说明：此门户只是一个纯静态跳板，不直接承担四端登录逻辑；
// 点击后跳转到各端自身的登录路径/入口。

interface AppLink {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  href: string; // 可以是相对或绝对 URL
  note?: string;
  roles: string[]; // 展示的角色标签
}

// 如果提供环境变量则优先使用（方便不同环境统一管理）
// 例如在 .env.local 中配置： VITE_ELDERLY_URL=http://localhost:5173/
// 改动：点击入口将按优先级尝试多个候选地址（例如先本地 localhost，再 47.96.238.102），
//       使用 Image ping 检测可达性以绕过 CORS 限制，找到第一个可达地址后跳转。
const apps: AppLink[] = [
  {
    id: 'elderly',
    icon: '👴',
    title: '老人端',
    desc: '健康监测 / 护理计划 / 用药提醒 / 活动报名 / 紧急呼叫',
    color: '#1d4ed8',
    href: '',
    roles: ['Elderly']
  },
  {
    id: 'family',
    icon: '👪',
    title: '家属端',
    desc: '老人概览 / 护理查看申请 / 费用结算 / 公告通知 / 探视预约',
    color: '#2563eb',
    href: '',
    roles: ['Family']
  },
  {
    id: 'staff',
    icon: '🩺',
    title: '员工端',
    desc: '主管/医生/护士/保洁/维修 多角色统一入口（登录后识别）',
    color: '#1e3a8a',
    href: '',
    roles: ['Supervisor','Doctor','Nurse','Cleaner','Maintenance']
  },
  {
    id: 'visitor',
    icon: '🧾',
    title: '访客端',
    desc: '访客登录 / 预约登记 / 批量预约 / 查询记录 / 修改密码',
    color: '#334155',
    href: '',
    roles: ['Visitor']
  }
];

// Helpers: ping URL by loading an image (works cross-origin) with a timeout
const pingUrl = (url: string, timeout = 1500): Promise<boolean> => {
  return new Promise(resolve => {
    let done = false;
    const img = new Image();
    const timer = setTimeout(() => { if (!done) { done = true; try { img.src = ''; } catch {} resolve(false); } }, timeout);
    img.onload = () => { if (!done) { done = true; clearTimeout(timer); resolve(true); } };
    img.onerror = () => { if (!done) { done = true; clearTimeout(timer); resolve(false); } };
    // try favicon or root resource
    try {
      img.src = url.replace(/\/$/, '') + '/favicon.ico?_=' + Date.now();
    } catch (e) {
      clearTimeout(timer);
      resolve(false);
    }
  });
};

const portMap: Record<string, number> = {
  elderly: 5173,
  family: 5174,
  staff: 5175,
  visitor: 5176
};

const getCandidatesFor = (id: string): string[] => {
  // 当在本机开发时：先尝试 localhost，再远程 IP；否则逻辑上不会被用到（直接跳远程）。
  const port = portMap[id] || 5173;
  return [
    `http://localhost:${port}/`,
    `http://47.96.238.102:${port}/`
  ];
};

const isLocalHostEnv = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const openBest = async (candidates: string[]) => {
  // 非本地访问：直接跳远程第二个候选（47.96.238.102）无需探测
  if (!isLocalHostEnv) {
    const remote = candidates[1] || candidates[0];
    window.location.href = remote;
    return;
  }
  // 本地开发：按顺序探测
  for (const c of candidates) {
    try {
      const ok = await pingUrl(c, 900);
      if (ok) { window.location.href = c; return; }
    } catch (_) {}
  }
  window.location.href = candidates[candidates.length - 1]; // fallback 用远程
};

export default function PortalApp(){
  const list = apps;
  return (
    <div className="fade-in portal-layout">
      <div className="portal-center">
        <header className="header header-large">
          <h1>智慧养老统一登录门户</h1>
          <div className="role-badges" style={{justifyContent:'center'}}>
            <div className="badge">单点访问</div>
            <div className="badge">多角色</div>
            <div className="badge">分端隔离</div>
            <div className="badge">安全登录</div>
          </div>
        </header>
        <main className="portal-main">
          <div className="portal-grid-fixed4-wrapper">
          <section className="portal-grid portal-grid-large portal-grid-fixed4">
            {list.map(app => (
              <article key={app.id} className="portal-card portal-card-large" style={{borderColor: app.color}}>
                <h3><span className="card-icon">{app.icon}</span>{app.title}</h3>
                <p>{app.desc}</p>
                <div className="links">
                  <button
                    onClick={() => { openBest(getCandidatesFor(app.id)); }}
                    className="button button-large"
                    style={{
                      background: app.color,
                      borderColor: app.color,
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >进入登录界面 →</button>
                  {app.note && <small style={{fontSize:12, opacity:.75}}>{app.note}</small>}
                </div>
                {/* footer with role badges removed as requested */}
              </article>
            ))}
          </section>
          </div>
          {list.length === 0 && (
            <p style={{textAlign:'center', marginTop:'2rem', color:'#1e3a8acc'}}>未找到匹配的终端，请更换关键词。</p>
          )}
        </main>
      </div>
      <footer className="site-footer">© {new Date().getFullYear()} 智慧养老平台 · Portal</footer>
    </div>
  );
}
