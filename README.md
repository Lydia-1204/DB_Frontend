# Smart Elderly Care 前端 Monorepo

> 多角色（门户 / 老人端 / 家属端 / 员工端 / 访客端）统一前端代码仓库，基于 pnpm Workspace + Vite + React + TypeScript。

## 目录速览

```
apps/
	portal-app/        # 门户聚合入口（角色登录/入口导航）
	elderly-app/       # 老人端：健康监测、用药提醒、护理计划
	family-app/        # 家属端：健康查看、费用结算、互动功能
	staff-app/         # 员工端：护理排班、健康评估、工作面板
	visitor-app/       # 访客端：访问信息、预约/登记（后续可扩展）
packages/
	types/             # 共享 TypeScript 类型定义包 (@smart-elderly-care/types)
pnpm-workspace.yaml  # pnpm 工作区配置
```

## 技术栈

- 包管理：pnpm Workspace
- 构建与开发：Vite 7 + React 19 + TypeScript 5
- 路由：react-router-dom 7
- UI/Icon：lucide-react（部分子应用）
- 代码质量：ESLint 9（各子应用含独立 eslint.config.js）

## 功能模块概述

| 子应用 | 典型组件/功能 | 补充说明 |
| ------ | ------------- | -------- |
| portal-app | 角色入口聚合、跳转 | 未来可扩展统一认证、SSO、公告等 |
| elderly-app | 健康监测 (HealthMonitor / Panel)、用药 & 语音提醒、护理计划、活动中心 | 关注可用性与无障碍（后续可补充 a11y） |
| family-app | 费用结算 (BillingSettlement)、健康数据查看、互动/活动 | 计划加入实时消息 / 推送 |
| staff-app | 护理排班 (NursingSchedule)、护理计划列表、健康评估 | 可能引入权限/角色细分 (RBAC) |
| visitor-app | 基础展示、预约入口（预留） | 可扩展访客审核流程、临时二维码 |
| packages/types | 统一类型：实体、接口参数等 | 减少重复与版本漂移 |

## 快速开始 (开发环境)

### 先决条件
- Node.js ≥ 18（建议 LTS）
- pnpm ≥ 9

### 安装依赖
```bash
pnpm install
```

### 同时启动所有主要子应用开发服务器
```bash
pnpm dev
```
并行启动：portal / elderly / family / staff / visitor（默认各自使用 Vite 随机或配置端口）。

### 单独启动某个子应用
```bash
pnpm dev:portal
pnpm dev:elderly
pnpm dev:family
pnpm dev:staff
pnpm dev:visitor
```

### 构建（示例：在某个子应用目录）
```bash
cd apps/elderly-app
pnpm build
```

### 预览某子应用打包结果
```bash
pnpm --filter=elderly-app preview
```
