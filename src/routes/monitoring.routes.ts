import { Router } from 'express';
import { register } from '../monitoring/metrics';
import { HealthMonitor } from '../monitoring/health';
import { Container } from '../container';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const healthMonitor = Container.get(HealthMonitor);

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    const health = await healthMonitor.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 存活探针
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 就绪探针
router.get('/readiness', async (req, res) => {
  try {
    const health = await healthMonitor.checkHealth();
    res.status(health.status === 'unhealthy' ? 503 : 200).json({
      status: health.status === 'healthy' ? 'ok' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: health.checks,
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 指标端点
router.get('/metrics', authenticate, authorize('admin'), async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    res.status(500).json({
      error: 'Failed to collect metrics',
    });
  }
});

export { router as monitoringRouter };