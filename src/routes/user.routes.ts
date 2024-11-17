import { Router } from 'express';
import { Container } from '../container';
import { UserController } from '../controllers/user.controller';
import { authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { updateUserSchema } from '../db/schema';

const router = Router();
const userController = Container.get(UserController);

router.route('/')
  .get(authorize('user.read'), userController.getAll.bind(userController))
  .post(authorize('user.create'), validateRequest(updateUserSchema), userController.create.bind(userController));

router.route('/:id')
  .get(authorize('user.read'), userController.getById.bind(userController))
  .patch(authorize('user.update'), validateRequest(updateUserSchema), userController.update.bind(userController))
  .delete(authorize('user.delete'), userController.delete.bind(userController));

router.post('/:id/password', authorize('user.update'), userController.changePassword.bind(userController));
router.post('/:id/email', authorize('user.update'), userController.changeEmail.bind(userController));
router.post('/:id/status', authorize('admin'), userController.changeStatus.bind(userController));

export { router as userRouter };