import { Router } from 'express';
import { Container } from '../container';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema';

const router = Router();
const authController = Container.get(AuthController);

router.post('/register', validateRequest(RegisterSchema), authController.register.bind(authController));
router.post('/login', validateRequest(LoginSchema), authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export { router as authRouter };