#!/usr/bin/env node
import { Web3Service } from './services/web3-service';

const web3service = new Web3Service();

const sleep = (ms: number) => {
  return new Promise(r => setTimeout(() => r(), ms));
};

export const waitForParity = async () => {
  while (true) {
    const status = await web3service.getParityNodeHealth();
    if (status.success) {
      console.info('parity ready');
      return;
    } else {
      console.info(status.error);
      await sleep(5000);
    }
  }
};
