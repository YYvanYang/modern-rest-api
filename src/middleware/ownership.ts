export function checkOwnership(resourceKey: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const resourceId = req.params[resourceKey];
    
    // Admins can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Users can only access their own resources
    if (resourceId !== req.user.id) {
      throw new AuthorizationError('Access denied');
    }

    next();
  };
}