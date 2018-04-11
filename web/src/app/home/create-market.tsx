import { Dashboard } from 'api/api';
import { flashMessageStore } from 'app/flash-message/flash-message-store';
import { Form } from 'common/form/form';
import { Select } from 'common/form/select';
import { TextInput } from 'common/form/text-input';
import { Modal } from 'common/modal/modal';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { tokenPairStore } from 'stores/token-pair-store';

interface ICreateMarketProps {
  onClose: () => void;
  onSuccess: (market: Dashboard.Api.IStoredMarket) => void;
}

@observer
export class CreateMarket extends React.Component<ICreateMarketProps> {
  @observable private selectedTokenPair?: Dashboard.Api.ITokenPair;
  @observable private label = '';

  public render() {
    const onLabelChange: React.ChangeEventHandler<HTMLInputElement> = event => this.label = event.target.value;

    return (
      <Modal onClose={this.props.onClose} title='Create Market'>
        <Form onSubmit={this.onSubmit}>
          <TextInput label='Label' placeholder='Label' autoFocus={true} required={true}
            value={this.label} onChange={onLabelChange} />
          <Select label='Token Pair' onChange={this.onChange} required={true}>
            <option value='' selected={true} disabled={true} hidden={true}>Select Token Pair</option>
            {tokenPairStore.tokenPairs.map((tp, i) => (
              <option key={i} value={i}>{tp.tokenA.symbol}/{tp.tokenB.symbol}</option>
            ))}
          </Select>
          <div>
            <button className='button primary fw' type='submit' disabled={!this.isValid()}>Submit</button>
          </div>
        </Form>
      </Modal>
    );
  }

  private onChange: React.ChangeEventHandler<HTMLSelectElement> = event => {
    const index = parseInt(event.target.value, 10);
    if (!isNaN(index)) {
      this.selectedTokenPair = tokenPairStore.tokenPairs[index];
    }
  }

  private readonly onSubmit = async () => {
    if (!this.isValid()) { return; }

    const { tokenA, tokenB } = this.selectedTokenPair as Dashboard.Api.ITokenPair;

    try {
      const market = await new Dashboard.Api.MarketsService().create({
        request: {
          label: this.label,
          baseTokenSymbol: tokenA.symbol,
          quoteTokenSymbol: tokenB.symbol
        }
      });
      this.props.onSuccess(market);
      this.props.onClose();
    } catch (err) {
      flashMessageStore.addMessage({
        type: 'error',
        content: 'There was an error creating the market; please check your submission and try again.'
      });
    }
  }

  private isValid() {
    return !!(this.label && this.selectedTokenPair);
  }
}
