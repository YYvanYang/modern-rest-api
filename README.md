# Modern RESTful API

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-%5E5.0.0-blue.svg)
![Express](https://img.shields.io/badge/Express-%5E4.18.0-green.svg)

一个企业级 Node.js RESTful API 框架，基于 TypeScript 和领域驱动设计，采用现代化架构模式和最佳实践。

## 目录

- [特性](#特性)
- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [开始使用](#开始使用)
- [项目结构](#项目结构)
- [API 文档](#api-文档)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [监控告警](#监控告警)
- [开发指南](#开发指南)
- [测试](#测试)
- [贡献指南](#贡献指南)
- [更新日志](#更新日志)
- [许可证](#许可证)

## 特性

### 核心功能
- ✨ 完整的认证和授权系统 (JWT)
- 📦 模块化和可扩展的架构
- 🔒 企业级安全实践
- 📝 自动生成的 OpenAPI 文档
- 🔍 完整的审计日志
- 💾 数据持久化和缓存

### 技术亮点
- 🎯 领域驱动设计（DDD）
- 🧩 依赖注入和控制反转
- 🚦 请求速率限制和并发控制
- 🔄 响应缓存和性能优化
- 📊 Prometheus 指标集成
- 🎨 Clean Architecture 架构

### 开发体验
- 🔥 TypeScript 支持
- 🧪 完整的测试套件
- 📝 规范的代码风格
- 🛠️ 开发工具集成
- 🐳 Docker 开发环境
- 📦 pnpm 包管理

## 系统架构

```plaintext
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    客户端层     │     │     应用层      │     │    基础设施层   │
│  Web/Mobile/API │────>│  业务逻辑处理   │────>│ 数据持久化/缓存 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ↑                       ↑                        ↑
        │                       │                        │
        └───────────────────────┼────────────────────────┘
                               │
                        ┌──────┴──────┐
                        │  监控/日志  │
                        └─────────────┘
```

## 技术栈

### 核心框架
- Node.js 20+
- TypeScript 5
- Express 4.18
- PostgreSQL 16
- Redis 7

### 工具和库
- Drizzle ORM
- Zod
- pino
- Jest
- OpenAPI/Swagger

### 基础设施
- Docker
- Prometheus
- Grafana
- pnpm

## 开始使用

### 前置要求

- Node.js >= 20.0.0
- PostgreSQL >= 16.0
- Redis >= 7.0
- Docker Engine >= 24.0 (可选)
- pnpm >= 8.0

### 本地开发环境

1. **克隆仓库**
```bash
git clone https://github.com/your-username/modern-rest-api.git
cd modern-rest-api
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**
```bash
cp .env.example .env
# 编辑 .env 文件配置环境变量
```

4. **数据库设置**
```bash
pnpm run migrate:run
```

5. **启动开发服务器**
```bash
pnpm run dev
```

### Docker 环境

1. **开发模式**
```bash
# 启动带有实时重载的开发环境
docker compose watch

# 仅启动依赖服务
docker compose up postgres redis -d
```

2. **生产模式**
```bash
# 构建和启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps
```

## 项目结构

```
src/
├── config/           # 配置文件
├── controllers/      # 控制器层
├── services/         # 服务层
├── repositories/     # 数据访问层
├── domain/          # 领域模型和接口
├── infrastructure/  # 基础设施
├── middleware/      # 中间件
├── utils/           # 工具函数
└── types/           # 类型定义
```

## API 文档

启动服务后访问以下地址：
- OpenAPI 文档: http://localhost:3000/api/v1/docs
- Swagger UI: http://localhost:3000/api/v1/docs/swagger

## 配置说明

### 环境变量

```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-password
DB_DATABASE=modern_api

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# 监控配置
MONITORING_ENABLED=true
METRICS_PATH=/metrics
```

### 资源限制

默认的容器资源限制：
- **API**: 1 CPU, 1GB RAM
- **PostgreSQL**: 1GB RAM
- **Redis**: 512MB RAM
- **Prometheus**: 512MB RAM
- **Grafana**: 512MB RAM

## 部署指南

### Docker 部署

1. **构建镜像**
```bash
docker build -t modern-api .
```

2. **运行容器**
```bash
docker run -p 3000:3000 --env-file .env modern-api
```

### 数据持久化

使用命名卷进行数据持久化：
- PostgreSQL: modern-api-postgres-data
- Redis: modern-api-redis-data
- Prometheus: modern-api-prometheus-data
- Grafana: modern-api-grafana-data

## 监控告警

### 监控端点

- 健康检查: `/health`
- 存活探针: `/liveness`
- 就绪探针: `/readiness`
- 指标接口: `/metrics`

### 指标收集

- HTTP 请求指标
- 响应时间统计
- 错误率监控
- 资源使用情况
- 缓存命中率

## 开发指南

### 代码风格

项目使用 ESLint 和 Prettier 进行代码规范：

```bash
# 运行代码检查
pnpm run lint

# 格式化代码
pnpm run format
```

### 提交规范

遵循 Conventional Commits 规范：
- feat: 新功能
- fix: 错误修复
- docs: 文档更新
- style: 代码风格更改
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm run test:watch

# 生成覆盖率报告
pnpm run test:coverage
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更新历史。

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
