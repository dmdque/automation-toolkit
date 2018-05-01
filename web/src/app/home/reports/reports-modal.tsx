import { Modal } from 'common/modal/modal';
import * as React from 'react';

interface IReportsModalProps {
  marketId: string;
  onClose: () => void;
}

export class ReportsModal extends React.Component<IReportsModalProps> {
  public render() {
    return (
      <Modal title='Reports' onClose={this.props.onClose}>
        <div className='h-padding v-padding'>
          <a href={`http://localhost:8662/api/reports/cancelations/${this.props.marketId}`} className='link'>Cancelation Report</a>
        </div>
      </Modal>
    );
  }
}
