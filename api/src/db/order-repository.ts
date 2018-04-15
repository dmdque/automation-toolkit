import { Aqueduct } from 'aqueduct';
import { Repository } from './repository';

export interface IStoredOrder extends Aqueduct.Api.Order {
  _id: string;
}

export class OrderRepository extends Repository<Aqueduct.Api.Order, IStoredOrder> {
}
