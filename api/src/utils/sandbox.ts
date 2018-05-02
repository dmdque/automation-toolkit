import { orderRepository } from '../db/order-repository';

(async () => {
  const orders = await orderRepository.find({ state: 0 });
  const orphaned = orders.filter(o => [219132, 219131, 219130, 219113].indexOf(o.id) === -1);
  console.log(orphaned);
})();
