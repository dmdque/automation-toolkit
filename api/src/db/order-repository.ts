import { Repository } from './repository';

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
  state: State;
  source: string;
  marketId: string;
  bandId: string;
  softCanceled: boolean;
}

export enum State {
  Open = 0,
  Canceled = 1,
  Filled = 2,
  Expired = 3,
  Removed = 4,
  PendingCancel = 5
}

export interface IStoredOrder extends IOrder {
  _id: string;
}

export class OrderRepository extends Repository<IOrder, IStoredOrder> implements IOrderRepository {
}

export class IOrderRepository extends Repository<IOrder, IStoredOrder> {
}

export const orderRepository = new OrderRepository();
