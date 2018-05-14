import { Dashboard } from 'api/api';
import { flashMessageStore } from 'app/flash-message/flash-message-store';
import { BigNumber } from 'bignumber.js';
import { Form } from 'common/form/form';
import { Select } from 'common/form/select';
import { TextInput } from 'common/form/text-input';
import { HoverTooltip } from 'common/hover-tooltip';
import { Modal } from 'common/modal/modal';
import { isValidFloat } from 'common/utils/numbers';
import { toBaseUnitAmount, toUnitAmount } from 'common/utils/unit-amount';
import { autorun, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { tickerStore } from 'stores/ticker-store';
import { tokenPairStore } from 'stores/token-pair-store';
import { ITokenReserveParams, TokenReserveInput } from './token-reserve-input';

interface ICreateMarketProps {
  onClose: () => void;
  onSuccess: (market: Dashboard.Api.IStoredMarket) => void;
}

interface IBalances {
  baseBalance: BigNumber;
  quoteBalance: BigNumber;
  ethBalance: BigNumber;
}

@observer
export class CreateMarket extends React.Component<ICreateMarketProps> {
  @observable private selectedTokenPair?: Dashboard.Api.ITokenPair;
  @observable private label = '';
  @observable private baseReserve?: ITokenReserveParams;
  @observable private quoteReserve?: ITokenReserveParams;
  @observable private balances?: IBalances;
  @observable private minEthBalance = '';
  @observable private cancellationMode: 'hard' | 'soft' = 'hard';

  constructor(public readonly props: ICreateMarketProps) {
    super(props);

    autorun(() => {
      if (this.selectedTokenPair) {
        this.loadBalances(this.selectedTokenPair);
      }
    });
  }

  public render() {
    const onLabelChange: React.ChangeEventHandler<HTMLInputElement> = event => this.label = event.target.value;
    const minEthBalanceError = this.minEthBalanceError();
    return (
      <Modal onClose={this.props.onClose} title='Create Market'>
        <Form onSubmit={this.onSubmit}>
          <TextInput label={<span>Label <HoverTooltip tooltipContent='A human-readable name to describe this market' width='300px' /></span>} placeholder='Label' autoFocus={true} required={true}
            value={this.label} onChange={onLabelChange} />
          <Select label='Token Pair' onChange={this.onTokenPairChange} required={true}>
            <option value='' selected={true} disabled={true} hidden={true}>Select Token Pair</option>
            {tokenPairStore.tokenPairs.map((tp, i) => (
              <option key={i} value={i}>{tp.tokenA.symbol}/{tp.tokenB.symbol}</option>
            ))}
          </Select>
          {this.selectedTokenPair && this.balances && <div>
            <TokenReserveInput token={this.selectedTokenPair.tokenA} onChange={this.onTokenAReserveChange}
              balance={this.balances.baseBalance} />
            <TokenReserveInput token={this.selectedTokenPair.tokenB} onChange={this.onTokenBReserveChange}
              balance={this.balances.quoteBalance} />
            <div className='token-reserve-input'>
              <label className='title sb'>
                <span>Minimum Ether Balance <HoverTooltip tooltipContent='Minimum Ether amount to keep in reserve. If owned Ether dips below this amount, all open positions will be canceled.' width='300px' /></span>
                <span className='balance-container'>
                  <span className='uppercase balance-label'>Balance</span>
                  {toUnitAmount({ token: { decimals: 18 }, value: this.balances.ethBalance }).toFormat(4)}&nbsp;
                  (~{tickerStore.getTokenUsdEquivalent({ decimals: 18, symbol: 'WETH' }, this.balances.ethBalance)} USD)
                </span>
              </label>
            </div>
            <TextInput type='text' placeholder='Minimum Ether Balance'
              onChange={this.onMinEthBalanceChange} value={this.minEthBalance} required={true} errorMessage={minEthBalanceError.error}
              infoMessage={minEthBalanceError.value && <span>~{tickerStore.getTokenUsdEquivalent({ decimals: 18, symbol: 'WETH' }, minEthBalanceError.value)} USD</span>} />
            <div>
              <label>Cancelation Mode</label>
              <div>
                <label>
                  <input type='radio' value='hard' checked={this.cancellationMode === 'hard'} onClick={this.handleModeSelect('hard')} />
                  <span>Hard Cancellation (costs gas, removed from blockchain)</span>
                </label>
                <label>
                  <input type='radio' value='soft' checked={this.cancellationMode === 'soft'} onClick={this.handleModeSelect('soft')} />
                  <span>Soft Cancellation (no gas costs, removes from ERC dEX UI)</span>
                </label>
              </div>
            </div>
          </div>}
          <div>
            <button className='button primary fw' type='submit' disabled={!this.isValid()}>Submit</button>
          </div>
        </Form>
      </Modal>
    );
  }

  private readonly handleModeSelect = (mode: 'hard' | 'soft') => () => this.cancellationMode = mode;

  private onTokenPairChange: React.ChangeEventHandler<HTMLSelectElement> = event => {
    const index = parseInt(event.target.value, 10);
    if (!isNaN(index)) {
      this.selectedTokenPair = tokenPairStore.tokenPairs[index];
    }
  }

  private onTokenAReserveChange = (params?: ITokenReserveParams) => {
    this.baseReserve = params;
  }

  private onTokenBReserveChange = (params?: ITokenReserveParams) => {
    this.quoteReserve = params;
  }

  private onMinEthBalanceChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    this.minEthBalance = event.target.value;
  }

  private readonly onSubmit = async () => {
    if (!this.isValid() || !this.baseReserve || !this.quoteReserve) { return; }

    const { tokenA, tokenB } = this.selectedTokenPair as Dashboard.Api.ITokenPair;

    try {
      const baseRes = this.baseReserve;
      const quoteRes = this.quoteReserve;
      const minEthAmount = this.minEthBalanceError().value as BigNumber;

      const market = await new Dashboard.Api.MarketsService().create({
        request: {
          label: this.label,
          baseTokenSymbol: tokenA.symbol,
          quoteTokenSymbol: tokenB.symbol,
          minBaseAmount: baseRes.min,
          maxBaseAmount: baseRes.max,
          minQuoteAmount: quoteRes.min,
          maxQuoteAmount: quoteRes.max,
          minEthAmount: minEthAmount.toString(),
          cancellationMode: this.cancellationMode
        }
      });
      this.props.onSuccess(market);
      this.props.onClose();
    } catch (err) {
      flashMessageStore.addMessage({
        type: 'error',
        content: err.message || 'There was an error creating the market; please check your submission and try again.'
      });
    }
  }

  private isValid() {
    return !!(this.label && this.selectedTokenPair && this.baseReserve && this.quoteReserve && this.minEthBalanceError().value);
  }

  private async loadBalances(tokenPair: Dashboard.Api.ITokenPair) {
    const getBalance = async (tokenAddress: string) => await new Dashboard.Api.AccountsService().getTokenBalance({ tokenAddress });

    const baseBalance = new BigNumber(await getBalance(tokenPair.tokenA.address));
    const quoteBalance = new BigNumber(await getBalance(tokenPair.tokenB.address));
    const ethBalance = new BigNumber(await new Dashboard.Api.AccountsService().getEthBalance());

    this.balances = { baseBalance, quoteBalance, ethBalance };
  }

  private minEthBalanceError(): { empty?: boolean; error?: string; value?: BigNumber; } {
    if (!this.minEthBalance) { return { empty: true }; }
    if (!isValidFloat(this.minEthBalance)) { return { error: 'Please enter a valid number' }; }

    const value = toBaseUnitAmount({ token: { decimals: 18 }, value: this.minEthBalance });
    if (value.isGreaterThanOrEqualTo((this.balances as IBalances).ethBalance)) {
      return { error: 'Insufficient balance' };
    }

    if (value.isLessThan(0)) {
      return { error: 'Must be a positive number' };
    }

    return { value };
  }
}
