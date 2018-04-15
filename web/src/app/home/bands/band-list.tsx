import { Dashboard } from 'api/api';
import { flashMessageStore } from 'app/flash-message/flash-message-store';
import { TextInput } from 'common/form/text-input';
import { IScrollableGridColumn, ScrollableGrid } from 'common/grid/scrollable-grid';
import { isValidFloat } from 'common/utils/numbers';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import './band-list.scss';

interface IBandListProps {
  side: 'buy' | 'sell';
  tokenPair: Dashboard.Api.ITokenPair;
  bands: Dashboard.Api.IStoredBand[];
  marketId: string;
  onCreate: (band: Dashboard.Api.IStoredBand) => void;
}

interface IInputValidation {
  error?: string;
  value?: number;
  empty?: boolean;
}

@observer
export class BandList extends React.Component<IBandListProps> {
  @observable private spread = '';
  @observable private ratio = '';
  @observable private duration = '';

  public render() {
    const columns: IScrollableGridColumn<Dashboard.Api.IStoredBand>[] = [
      {
        header: 'Spread %',
        getElement: b => <span>{b.spread * 100}%</span>,
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
        getElement: _b => <span />,
        widthPoints: .5
      }
    ];

    const bodyStyle: React.CSSProperties = this.props.side === 'sell'
      ? { display: 'flex', flexFlow: 'column nowrap' }
      : { display: 'flex', flexDirection: 'column' };

    const initialScrollPosition = this.props.side === 'sell'
      ? 'bottom'
      : 'top';

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
      </div>
    );
  }

  private createRow() {
    return (
      <form className='fl h-padding' onSubmit={this.onSubmit}>
        <TextInput required={true} type='string' placeholder='Spread %'
          onChange={this.handleInputChange(v => this.spread = v)} errorMessage={this.spreadValidation().error} />
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
    if (!this.spread) { return { empty: true }; }
    if (!isValidFloat(this.spread)) { return { error: 'Please enter a valid number' }; }

    const float = parseFloat(this.spread);
    if (float <= 0 || float >= 100) {
      return { error: 'Must be between 0 and 100' };
    }

    return { value: float / 100 };
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
          spread: spread.value,
          ratio: ratio.value,
          expirationSeconds: duration.value
        }
      });
      this.props.onCreate(band);
      this.spread = this.duration = this.ratio = '';
    } catch (err) {
      flashMessageStore.addMessage({
        type: 'error',
        content: err.message
      });
    }
  }
}
