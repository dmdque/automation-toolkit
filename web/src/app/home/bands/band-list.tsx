import { Dashboard } from 'api/api';
import { flashMessageStore } from 'app/flash-message/flash-message-store';
import { ISelectStopBehaviorProps, SelectStopBehavior } from 'app/home/select-stop-behavior';
import { TextInput } from 'common/form/text-input';
import { IScrollableGridColumn, ScrollableGrid } from 'common/grid/scrollable-grid';
import { isValidFloat } from 'common/utils/numbers';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { BandLogViewer } from '../log-viewer/band-log-viewer';
import './band-list.scss';

interface IBandListProps {
  side: 'buy' | 'sell';
  tokenPair: Dashboard.Api.ITokenPair;
  bands: Dashboard.Api.IStoredBand[];
  marketId: string;
  onCreate: (band: Dashboard.Api.IStoredBand) => void;
  onRemove: (band: Dashboard.Api.IStoredBand) => void;
}

interface IInputValidation {
  error?: string;
  value?: number;
  empty?: boolean;
}

@observer
export class BandList extends React.Component<IBandListProps> {
  @observable private spreadBps = '';
  @observable private ratio = '';
  @observable private duration = '';
  @observable private viewingBand?: Dashboard.Api.IStoredBand;
  @observable private selectStopBehaviorProps?: ISelectStopBehaviorProps;

  public render() {
    const columns: IScrollableGridColumn<Dashboard.Api.IStoredBand>[] = [
      {
        header: 'Spread BPS',
        getElement: b => <span>{b.spreadBps}</span>,
        widthPoints: 1
      },
      {
        header: 'Ratio %',
        getElement: b => <span>{b.ratio * 100}%</span>,
        widthPoints: 1
      },
      {
        header: 'Duration (seconds)',
        getElement: b => <span>{b.expirationSeconds}</span>,
        widthPoints: 1
      },
      {
        header: '',
        getElement: band => {
          const onRemoveBand = () => this.removeBand(band);
          const onViewLogs = () => this.viewingBand = band;

          return (
            <div className='fl fe r-padding fw'>
              <span className='link' onClick={onViewLogs}>Logs</span>
              <span className='link' onClick={onRemoveBand}>Remove</span>
            </div>
          );
        },
        widthPoints: .5
      }
    ];

    const bodyStyle: React.CSSProperties = this.props.side === 'sell'
      ? { display: 'flex', flexFlow: 'column nowrap' }
      : { display: 'flex', flexDirection: 'column' };

    const initialScrollPosition = this.props.side === 'sell'
      ? 'bottom'
      : 'top';

    const onCloseBandLogs = () => this.viewingBand = undefined;

    const bands = this.props.bands;
    return (
      <div className='band-list fl co grow'>
        <div className='band-list-title uppercase'>{this.props.side} Bands</div>
        <div className='scrollable-grid-container grow'>
          <ScrollableGrid models={bands} columns={columns} initialScrollPosition={initialScrollPosition}
            rowContent={this.getRowContent} bodyStyle={bodyStyle}
            className={this.props.side === 'sell' ? 'align-end' : undefined} />
          {this.createRow()}
        </div>
        {this.viewingBand && <BandLogViewer bandId={this.viewingBand._id} onClose={onCloseBandLogs} />}
        {this.selectStopBehaviorProps && <SelectStopBehavior {...this.selectStopBehaviorProps} />}
      </div>
    );
  }

  private createRow() {
    return (
      <form className='fl h-padding' onSubmit={this.onSubmit}>
        <TextInput required={true} type='string' placeholder='Spread BPS'
          onChange={this.handleInputChange(v => this.spreadBps = v)} errorMessage={this.spreadValidation().error} />
        <TextInput required={true} type='string' placeholder='Ratio %'
          onChange={this.handleInputChange(v => this.ratio = v)} errorMessage={this.ratioValidation().error} />
        <TextInput required={true} type='string' placeholder='Duration (seconds)'
          onChange={this.handleInputChange(v => this.duration = v)} errorMessage={this.durationValidation().error} />
        <div className='fl vc'>
          <button type='submit'>
            <i className={`fa fa-check ${this.isValidCreate() ? 'valid' : 'disabled'}`} />
          </button>
        </div>
      </form>
    );
  }

  private async removeBand(band: Dashboard.Api.IStoredBand) {
    const validation = await new Dashboard.Api.BandsService().validateRemoveBand({ bandId: band._id });
    if (validation.hasActiveOrders) {
      this.selectStopBehaviorProps = {
        onClose: () => this.selectStopBehaviorProps = undefined,
        onSelect: async (immediateCancelation: boolean) => await this.executeRemove(band, immediateCancelation),
        message: 'There are currently live orders in this band.',
        submitText: 'Remove band'
      };
      return;
    }

    await this.executeRemove(band, false);
  }

  private async executeRemove(band: Dashboard.Api.IStoredBand, immediateCancelation: boolean) {
    await new Dashboard.Api.BandsService().removeBand({
      request: {
        bandId: band._id,
        immediateCancelation
      }
    });
    this.props.onRemove(band);
  }

  private readonly getRowContent = (b: Dashboard.Api.IStoredBand) => {
    return (
      <div className='volume-bar-container'>
        <div className={`volume-bar ${b.side}`} style={{ width: `${b.ratio * 100}%`, height: '100%' }} />
      </div>
    );
  }

  private readonly handleInputChange = (cb: (value: string) => void): React.ChangeEventHandler<HTMLInputElement> => event => {
    cb(event.target.value);
  }

  private spreadValidation(): IInputValidation {
    if (!this.spreadBps) { return { empty: true }; }
    if (!isValidFloat(this.spreadBps)) { return { error: 'Please enter a valid number' }; }

    const value = parseInt(this.spreadBps, 10);
    if (value <= 0 || value >= 100) {
      return { error: 'Must be between 0 and 10000' };
    }

    return { value };
  }

  private ratioValidation(): IInputValidation {
    if (!this.ratio) { return { empty: true }; }
    if (!isValidFloat(this.ratio)) { return { error: 'Please enter a valid number' }; }

    const float = parseFloat(this.ratio);
    if (float < .1 || float > 100) {
      return { error: 'Must be between .1 and 100' };
    }

    return { value: float / 100 };
  }

  private durationValidation(): IInputValidation {
    if (!this.duration) { return { empty: true }; }
    if (!isValidFloat(this.duration)) { return { error: 'Please enter a valid number' }; }

    const float = parseFloat(this.duration);
    if (float < 600) {
      return { error: 'Must be at least 600 (10 minutes)' };
    }

    return { value: float };
  }

  private isValidCreate() {
    return this.spreadValidation().value && this.ratioValidation().value && this.durationValidation().value;
  }

  private readonly onSubmit: React.ChangeEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();

    const spread = this.spreadValidation();
    const ratio = this.ratioValidation();
    const duration = this.durationValidation();

    if (!spread.value || !ratio.value || !duration.value) { return; }

    const { marketId, side } = this.props;
    try {
      const band = await new Dashboard.Api.BandsService().createBand({
        request: {
          marketId,
          side,
          spreadBps: spread.value,
          ratio: ratio.value,
          expirationSeconds: duration.value
        }
      });
      this.props.onCreate(band);
      this.spreadBps = this.duration = this.ratio = '';
    } catch (err) {
      flashMessageStore.addMessage({
        type: 'error',
        content: err.message
      });
    }
  }
}
