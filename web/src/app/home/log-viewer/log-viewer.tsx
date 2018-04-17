import { Dashboard } from 'api/api';
import { IScrollableGridColumn, ScrollableGrid } from 'common/grid/scrollable-grid';
import { LoadingScreen } from 'common/loading-screen';
import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as moment from 'moment';
import * as React from 'react';
import './log-viewer.scss';

interface ILogViewerProps {
  marketId: string;
  onClose: () => void;
}

@observer
export class LogViewer extends React.Component<ILogViewerProps> {
  @observable private logs?: Dashboard.Api.IStoredLog[];

  constructor(public readonly props: ILogViewerProps) {
    super(props);
    this.load();
  }

  public render() {
    return (
      <Modal title='Viewing Logs' onClose={this.props.onClose} className='log-viewer'>
        {this.getContent()}
      </Modal>
    );
  }

  private getContent() {
    if (!this.logs) {
      return <LoadingScreen />;
    }

    const columns: IScrollableGridColumn<Dashboard.Api.IStoredLog>[] = [
      {
        header: 'Timestamp',
        getElement: l => <span>{moment(l.dateCreated).format('h:mm:ss A MM/DD/YY')}</span>,
        widthPoints: 1
      },
      {
        header: 'Message',
        getElement: l => (
          <div className={`message ${l.severity}`}>
            {l.message}
          </div>
        ),
        widthPoints: 3
      }
    ];

    return (
      <div className='log-list'>
        <div className='fl fe control-bar'>
          <div className='control refresh' onClick={this.load}>
            <i className='fa fa-refresh' />
            <span>Refresh</span>
          </div>
        </div>

        <ScrollableGrid models={this.logs} emptyPlaceholder='No Logs Available' columns={columns} />
      </div>
    );
  }

  private readonly load = async () => {
    this.logs = undefined;
    this.logs = await new Dashboard.Api.LogsService().get({
      marketId: this.props.marketId
    });
  }
}
