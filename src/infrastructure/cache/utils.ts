import { createHash } from 'crypto';

export function generateCacheKey(
  className: string,
  methodName: string,
  args: any[]
): string {
  const argsHash = createHash('sha256')
    .update(JSON.stringify(args))
    .digest('hex');

  return `${className}:${methodName}:${argsHash}`;
}