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
const apps: AppLink[] = [
  {
    id: 'elderly',
    icon: '👴',
    title: '老人端',
    desc: '健康监测 / 护理计划 / 用药提醒 / 活动报名 / 紧急呼叫',
    color: '#1d4ed8',
  href: (import.meta as any).env?.VITE_ELDERLY_URL || 'http://localhost:5173/',
    roles: ['Elderly']
  },
  {
    id: 'family',
    icon: '👪',
    title: '家属端',
    desc: '老人概览 / 护理查看申请 / 费用结算 / 公告通知 / 探视预约',
    color: '#2563eb',
  href: (import.meta as any).env?.VITE_FAMILY_URL || 'http://localhost:5174/',
    roles: ['Family']
  },
  {
    id: 'staff',
    icon: '🩺',
    title: '员工端',
    desc: '主管/医生/护士/保洁/维修 多角色统一入口（登录后识别）',
    color: '#1e3a8a',
  href: (import.meta as any).env?.VITE_STAFF_URL || 'http://localhost:5175/',
    roles: ['Supervisor','Doctor','Nurse','Cleaner','Maintenance']
  },
  {
    id: 'visitor',
    icon: '🧾',
    title: '访客端',
    desc: '访客登录 / 预约登记 / 批量及单个预约 / 查询记录 / 修改密码',
    color: '#334155',
  href: (import.meta as any).env?.VITE_VISITOR_URL || 'http://localhost:5176/',
    roles: ['Visitor']
  }
];

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
                    onClick={() => { window.location.href = app.href; }}
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
