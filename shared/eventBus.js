import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  publish(event, data) {
    console.log(`📡 Publishing event: ${event}`, data);
    this.emit(event, data);
  }
  
  subscribe(event, callback) {
    console.log(`📻 Subscribing to event: ${event}`);
    this.on(event, callback);
  }
}

export const eventBus = new EventBus();