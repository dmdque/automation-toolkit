import * as request from 'request-promise-native';

const sleep = (ms: number) => {
  return new Promise(r => setTimeout(() => r(), ms));
};

export const waitForAqueductRemote = async () => {
  while (true) {
    try {
      await request({
        method: 'GET',
        uri: 'http://aqueduct-remote:8700/api/wallet/accounts'
      });
      console.log('aqueduct remote ready');
      return;
    } catch {
      console.error('waiting for aqueduct remote to start...');
      await sleep(5000);
    }
  }
};
