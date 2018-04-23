import { Dashboard } from 'api/api';
import * as React from 'react';
import { LogViewer } from './log-viewer';

interface IMarketLogViewerProps {
  marketId: string;
  onClose: () => void;
}

export class MarketLogViewer extends React.Component<IMarketLogViewerProps> {
  public render() {
    return (
      <LogViewer onClose={this.props.onClose} logsFn={this.logsFn} />
    );
  }

  private readonly logsFn = async () => {
    return await new Dashboard.Api.LogsService().getMarket({
      marketId: this.props.marketId
    });
  }
}
