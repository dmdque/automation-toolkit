import { expect } from 'chai';
import { parityAccountRepository } from '../../db/parity-account-repository';
import { PendingAqueductService } from '../../services/pending-aqueduct-service';
import { AqueductRemote } from '../../swagger/aqueduct-remote';
import { clearDatabases } from '../fixtures/prepare-db';
import { mock } from '../utils/mock';

describe('PendingAqueductService', () => {
  beforeEach(async () => {
    await clearDatabases();
  });

  afterEach(async () => {
    await clearDatabases();
  });

  describe('waitForAqueductRemote', () => {
    const firstAddress = 'account-1';
    const secondAddress = 'account-2';
    const service = new PendingAqueductService(mock<AqueductRemote.Api.WalletService>({
      getAccounts: async () => {
        return [firstAddress, secondAddress];
      }
    }));

    it('should store accounts', async () => {
      await service.waitForAqueductRemote();

      const accounts = await parityAccountRepository.find({}, {
        sort: { key: 'account', direction: 'asc' }
      });
      expect(accounts.length).to.equal(2);

      const firstAccount = accounts[0];
      expect(firstAccount.account).to.equal(firstAddress);
      expect(firstAccount.locked).to.equal(true);

      const secondAccount = accounts[1];
      expect(secondAccount.account).to.equal(secondAddress);
      expect(secondAccount.locked).to.equal(true);
    });

    it('should handle existing accounts', async () => {
      await parityAccountRepository.create({
        account: secondAddress,
        locked: false
      });

      await service.waitForAqueductRemote();

      const accounts = await parityAccountRepository.find({}, {
        sort: { key: 'account', direction: 'asc' }
      });
      expect(accounts.length).to.equal(2);

      const firstAccount = accounts[0];
      expect(firstAccount.account).to.equal(firstAddress);
      expect(firstAccount.locked).to.equal(true);

      const secondAccount = accounts[1];
      expect(secondAccount.account).to.equal(secondAddress);
      expect(secondAccount.locked).to.equal(false);
    });
  });
});
