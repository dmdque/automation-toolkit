import * as React from 'react';
import './modal.scss';

interface IModalProps {
  className?: string;
  title: string;
  onClose: () => void;
}

export class Modal extends React.Component<IModalProps> {
  public render() {
    return (
      <div className='modal-outer-container'>
        <div className='modal-inner-container'>
          <div className={`modal ${this.props.className || ''}`}>
            {this.props.title && <div className='modal-header'>{this.props.title}</div>}
            <div className='close' onClick={this.props.onClose} />
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}
