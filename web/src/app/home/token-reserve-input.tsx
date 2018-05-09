import { BigNumber } from 'bignumber.js';
import { TextInput } from 'common/form/text-input';
import { HoverTooltip } from 'common/hover-tooltip';
import { isValidFloat } from 'common/utils/numbers';
import { toBaseUnitAmount, toUnitAmount } from 'common/utils/unit-amount';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { tickerStore } from 'stores/ticker-store';
import './token-reserve-input.scss';

interface ITokenReserveInputProps {
  token: {
    decimals: number;
    symbol: string;
  };
  onChange: (params?: ITokenReserveParams) => void;
  balance: BigNumber;
}

export interface ITokenReserveParams {
  max: string;
  min: string;
}

@observer
export class TokenReserveInput extends React.Component<ITokenReserveInputProps> {
  @observable private max = '';
  @observable private min = '';

  public render() {
    const maxValidation = this.maxValidation();
    const minValidation = this.minValidation();
    return (
      <div className='token-reserve-input'>
        <label className='title sb'>
          <span>{this.props.token.symbol} Parameters</span>
          <span className='balance-container'>
            <span className='uppercase balance-label'>Balance</span>
            {toUnitAmount({ token: this.props.token, value: this.props.balance }).toFormat(4)}&nbsp;
            (~{tickerStore.getTokenUsdEquivalent(this.props.token, this.props.balance)} USD)
          </span>
        </label>
        <div className='fl sb'>
          <div className='field'>
            <TextInput label={<span>Max Amount <HoverTooltip width='300px' tooltipContent='Represents the maximum number of tokens in open positions at one time; this will be your initial, total open position' /></span>} className='input' type='text' placeholder='Max Amount'
              onChange={this.onInitialChange} value={this.max} required={true} errorMessage={maxValidation.error}
              infoMessage={maxValidation.value && <span>~{tickerStore.getTokenUsdEquivalent(this.props.token, maxValidation.value)} USD</span>} />
          </div>
          <div className='field'>
            <TextInput label={<span>Min Amount <HoverTooltip width='300px'
              tooltipContent='Represents the minimum number of tokens in open positions at one time. If your token balance falls below this amount, no more positions on this side of the trade will be opened.' /></span>} type='text' placeholder='Min Amount'
              onChange={this.onMinChange} value={this.min} required={true} errorMessage={minValidation.error}
              infoMessage={minValidation.value && <span>~{tickerStore.getTokenUsdEquivalent(this.props.token, minValidation.value)} USD</span>} />
          </div>
        </div>
      </div>
    );
  }

  private readonly onInitialChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.max = event.target.value;
    this.processChange();
  }

  private maxValidation() {
    return this.genericInputValidation(this.max);
  }

  private minValidation() {
    return this.genericInputValidation(this.min);
  }

  private genericInputValidation(value: string): { error?: string; empty?: boolean; value?: BigNumber; } {
    const formatValidation = this.formatValidation(value);
    if (!formatValidation.valid) { return formatValidation; }

    const bn = toBaseUnitAmount({ token: this.props.token, value });
    if (bn.isGreaterThan(this.props.balance)) {
      return { error: 'Insufficient balance' };
    }

    if (bn.isLessThan(0)) {
      return { error: 'Must be a positive number' };
    }

    return { value: bn };
  }

  private formatValidation(value: string) {
    if (!value) { return { empty: true }; }
    if (!isValidFloat(value)) { return { error: 'Please provide a valid number' }; }

    return { valid: true };
  }

  private readonly onMinChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.min = event.target.value;
    this.processChange();
  }

  private processChange() {
    const minValidation = this.minValidation();
    const maxValidation = this.maxValidation();

    if (minValidation.value && maxValidation.value) {
      this.props.onChange({
        max: maxValidation.value.toString(),
        min: minValidation.value.toString()
      });
      return;
    }

    this.props.onChange();
  }
}
