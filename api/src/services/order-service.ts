import { Aqueduct } from 'aqueduct';

export class OrderService {
  public onChange(account: string, cb: (data: Aqueduct.Events.IOrderChangeEventData) => void) {
    new Aqueduct.Events.AccountOrderChange().subscribe({ account }, data => {
      cb(data);
    });
  }
}
