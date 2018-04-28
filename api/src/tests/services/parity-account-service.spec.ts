import { expect } from 'chai';
import { IStoredParityAccount, parityAccountRepository } from '../../db/parity-account-repository';
import { ParityAccountService } from '../../services/parity-account-service';
import { AqueductRemote } from '../../swagger/aqueduct-remote';
import { clearDatabases } from '../fixtures/prepare-db';
import { shouldThrow } from '../should-throw';
import { mock } from '../utils/mock';

describe('ParityAccountService', () => {
  beforeEach(async () => await clearDatabases());
  afterEach(async () => await clearDatabases());

  describe('unlockAccount', () => {
    it('throws server error on bogus account', async () => {
      const err = await shouldThrow(() => new ParityAccountService().unlockAccount({ account: 'fake', passphrase: '' }));
      expect(err.status).to.equal(404);
      expect(err.constructor.name).to.equal('ServerError');
    });

    describe('with existing account', () => {
      let account: IStoredParityAccount;
      beforeEach(async () => {
        account = await parityAccountRepository.create({
          account: 'account-1',
          locked: true
        });
      });

      it('throws server error on unlock failure', async () => {
        const err = await shouldThrow(() => new ParityAccountService(mock<AqueductRemote.Api.IWalletService>({
          unlockAccount: async () => {
            throw new Error('any');
          }
        })).unlockAccount({ account: account.account, passphrase: 'a passphrase' }));

        expect(err.status).to.equal(500);
        expect(err.constructor.name).to.equal('ServerError');
      });

      it('should set lock state on parity account if successful', async () => {
        await new ParityAccountService(mock<AqueductRemote.Api.IWalletService>({
          unlockAccount: async () => { return; }
        })).unlockAccount({ account: account.account, passphrase: 'a passphrase' });

        const updatedAccount = await parityAccountRepository.findOne({ _id: account._id }) as IStoredParityAccount;
        expect(updatedAccount).to.not.equal(undefined);
        expect(updatedAccount.locked).to.equal(false);
      });
    });
  });
});
