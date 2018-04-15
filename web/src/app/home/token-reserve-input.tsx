import { BigNumber } from 'bignumber.js';
import { TextInput } from 'common/form/text-input';
import { isValidFloat } from 'common/utils/numbers';
import { toBaseUnitAmount, toUnitAmount } from 'common/utils/unit-amount';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
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
  initial: string;
  min: string;
}

@observer
export class TokenReserveInput extends React.Component<ITokenReserveInputProps> {
  @observable private initial = '';
  @observable private min = '';

  public render() {
    return (
      <div className='token-reserve-input'>
        <label className='title sb'>
          <span>{this.props.token.symbol} Parameters</span>
          <span className='balance-container'>
            <span className='uppercase balance-label'>Balance</span>
            {toUnitAmount({ token: this.props.token, value: this.props.balance }).toFormat(4)}
          </span>
        </label>
        <div className='fl sb'>
          <div className='field'>
            <TextInput label='Initial Amount' className='input' type='text' placeholder='Initial Amount'
              onChange={this.onInitialChange} value={this.initial} required={true} errorMessage={this.initialValidation().error} />
          </div>
          <div className='field'>
            <TextInput label='Min Amount' type='text' placeholder='Min Amount'
              onChange={this.onMinChange} value={this.min} required={true} errorMessage={this.minValidation().error} />
          </div>
        </div>
      </div>
    );
  }

  private readonly onInitialChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.initial = event.target.value;
    this.processChange();
  }

  private initialValidation() {
    return this.genericInputValidation(this.initial);
  }

  private minValidation() {
    return this.genericInputValidation(this.min);
  }

  private genericInputValidation(value: string): { error?: string; empty?: boolean; valid?: boolean; } {
    const formatValidation = this.formatValidation(value);
    if (!formatValidation.valid) { return formatValidation; }

    const bn = toBaseUnitAmount({ token: this.props.token, value });
    if (bn.isGreaterThan(this.props.balance)) {
      return { error: 'Insufficient balance' };
    }

    return { valid: true };
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
    if (this.minValidation().valid && this.initialValidation().valid) {
      const toBase = (value: string) => toBaseUnitAmount({ token: this.props.token, value });
      this.props.onChange({
        initial: toBase(this.initial).toString(),
        min: toBase(this.min).toString()
      });
      return;
    }

    this.props.onChange();
  }
}
