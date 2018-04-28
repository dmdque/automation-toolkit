import { Repository } from './repository';

export interface IParityAccount {
  account: string;
  locked: boolean;
}

export interface IStoredParityAccount extends IParityAccount {
  _id: string;
}

export class ParityAccountRepository extends Repository<IParityAccount, IStoredParityAccount> {
}

export const parityAccountRepository = new ParityAccountRepository();
