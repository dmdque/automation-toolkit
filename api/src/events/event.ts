import * as PubSub from 'pubsub-js';

export abstract class Event<T> {
  protected abstract topic: string;

  public subscribe(cb: (data: T) => void) {
    PubSub.subscribe(this.topic, (_msg: string, data: T) => {
      cb(data);
    });
  }

  public publish(data: T) {
    PubSub.publish(this.topic, data);
  }
}
