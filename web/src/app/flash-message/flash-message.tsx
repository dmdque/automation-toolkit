import { observer } from 'mobx-react';
import * as React from 'react';
import { flashMessageStore, IFlashMessageInstance } from './flash-message-store';
import './flash-message.scss';

interface IFlashMessageProps {
}

@observer
export class FlashMessage extends React.Component<IFlashMessageProps> {
  public render() {
    const handleClose = (m: IFlashMessageInstance) => () => {
      flashMessageStore.removeMessage(m);
    };

    return (
      <div className='flash-message-container'>
        <div className='flash-message-inner-container'>
          {flashMessageStore.messages.map(m => (
            <div className={`flash-message ${m.type}`}>
              {m.content}
              <div className='close' onClick={handleClose(m)} />
            </div>
          ))}
        </div>
      </div>
    );
  }
}
