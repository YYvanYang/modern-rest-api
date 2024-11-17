import { EventEmitter } from 'events';
import { logger } from '../infrastructure/logger';

export type EventHandler<T = any> = (data: T) => Promise<void> | void;

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  async emit(eventName: string, data: any): Promise<boolean> {
    logger.debug({ event: eventName, data }, 'Event emitted');
    return super.emit(eventName, data);
  }
}

export const eventEmitter = new AppEventEmitter();