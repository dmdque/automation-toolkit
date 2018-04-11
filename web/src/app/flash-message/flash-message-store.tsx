import { observable } from 'mobx';
import * as React from 'react';

export interface IFlashMessageOptions {
  type: 'success' | 'error';
  content: React.ReactNode;
  /**
   * Defaults to 10000 ms
   */
  timeout?: number;
}

export interface IFlashMessageInstance extends IFlashMessageOptions {
  guid: string;
}

const generateGuid = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export class FlashMessageStore {
  @observable public messages = new Array<IFlashMessageInstance>();

  public readonly addMessage = (options: IFlashMessageOptions) => {
    const instance = {
      ...options,
      guid: generateGuid()
    };
    this.messages.unshift(instance);

    setTimeout(() => {
      this.removeMessage(instance);
    }, options.timeout || 10000);
  }

  public removeMessage = (message: IFlashMessageInstance) => {
    const index = this.messages.findIndex(m => m.guid === message.guid);
    if (index !== -1) {
      this.messages.splice(index, 1);
    }
  }
}

export const flashMessageStore = new FlashMessageStore();
