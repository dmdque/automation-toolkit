import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';
import { config } from '../../config';
import { GasService, IGasStationProvider } from '../../services/gas-service';

describe('GasService', () => {
  const provider: IGasStationProvider = {
    request: async () => {
      return {
        'safelow_calc': 10.0,
        'average_calc': 10.0,
        'average': 20.0,
        'safelow_txpool': 20.0,
        'fastest': 200.0,
        'fast': 40.0,
        'average_txpool': 20.0,
        'block_time': 16.306122448979593,
        'speed': 0.6894505499517887,
        'fastWait': 0.5,
        'safeLowWait': 0.7,
        'blockNum': 5568708,
        'fastestWait': 0.5,
        'safeLow': 20.0,
        'avgWait': 0.7
      };
    }
  };

  it ('should calculate safelow correctly', async () => {
    config.gasSetting = 'safelow';
    const service = new GasService(provider);
    const result = await service.getGasPrice() as BigNumber;

    expect(result.toString()).to.equal('2000000000');
  });

  it ('should calculate standard correctly', async () => {
    config.gasSetting = 'standard';
    const service = new GasService(provider);
    const result = await service.getGasPrice() as BigNumber;

    expect(result.toString()).to.equal('2000000000');
  });

  it ('should calculate fast correctly', async () => {
    config.gasSetting = 'fast';
    const service = new GasService(provider);
    const result = await service.getGasPrice() as BigNumber;

    expect(result.toString()).to.equal('4000000000');
  });
});
