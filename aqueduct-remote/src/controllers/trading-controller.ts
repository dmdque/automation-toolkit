import { CancelOrder, LimitOrder } from 'aqueduct';
import { BigNumber } from 'bignumber.js';
import { Body, Post, Route, Tags } from 'tsoa';
import { config } from '../config';
import { ServerError } from '../server-error';
import { Web3Service } from '../services/web3-service';
import { ICancelReceipt, ZeroExService } from '../services/zero-ex-service';

export interface ILimitOrderRequest {
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  expirationDate: Date;
  price: string;
  quantityInWei: string;
  side: string;
}

export interface IOrder {
  id: number;
  dateCreated: Date;
  dateUpdated: Date;
  dateClosed: Date;
  networkId: number;
  exchangeContractAddress: string;
  expirationUnixTimestampSec: number;
  feeRecipient: string;
  maker: string;
  makerFee: string;
  makerTokenAddress: string;
  makerTokenAmount: string;
  salt: string;
  serializedEcSignature: string;
  taker: string;
  takerFee: string;
  takerTokenAddress: string;
  takerTokenAmount: string;
  remainingTakerTokenAmount: string;
  orderHash: string;
  accountId?: number;
  state: number;
  source: string;
}

@Route('trading')
export class TradingController {
  @Post('limit_order')
  @Tags('Trading')
  public async createLimitOrder(@Body() request: ILimitOrderRequest): Promise<IOrder> {
    const account = await new Web3Service().getAccount();
    const {
      baseTokenSymbol, quoteTokenSymbol,
      price, quantityInWei, expirationDate, side
    } = request;

    if (side !== 'buy' && side !== 'sell') {
      throw new ServerError(`side must be buy or sell; got ${side}`, 400);
    }

    const order = await new LimitOrder({
      account,
      baseTokenSymbol,
      quoteTokenSymbol,
      nodeUrl: config.nodeUrl,
      price: new BigNumber(price),
      expirationDate,
      type: request.side as 'buy' | 'sell',
      quantityInWei: new BigNumber(quantityInWei)
    }).execute();

    return order;
  }

  @Post('cancel_order/{orderHash}')
  @Tags('Trading')
  public async cancelOrder(orderHash: string): Promise<string> {
    return await new CancelOrder({
      nodeUrl: config.nodeUrl,
      orderHash
    }).execute();
  }

  @Post('cancel_receipt/{txHash}')
  @Tags('Trading')
  public async getCancelReceipt(txHash: string): Promise<ICancelReceipt> {
    return await new ZeroExService().getCancelReceipt(txHash);
  }
}
