import { Wallet, ethers } from 'ethers';

import { ChimeraMigrationFactory } from './../src/generated/ChimeraMigrationFactory';
import { DeploymentStage } from '@imtbl/deployment-utils';

export class ChimeraMigrationStage implements DeploymentStage {
  private wallet: Wallet;

  constructor(privateKey: string, rpcUrl: string) {
    this.wallet = new ethers.Wallet(privateKey, new ethers.providers.JsonRpcProvider(rpcUrl));
  }

  async deploy(
    findInstance: (name: string) => Promise<string>,
    onDeployment: (name: string, address: string, dependency: boolean) => void,
    transferOwnership: (addresses: string[]) => void,
  ) {
    const oldCardsAddress = await findInstance('LegacyCards');
    const newCardsAddress = await findInstance('Cards');
    const chimera =
      (await findInstance('ChimeraMigration')) ||
      (await this.deployChimeraMigration(oldCardsAddress, newCardsAddress));
    onDeployment('ChimeraMigration', chimera, false);
    transferOwnership([chimera]);
  }

  async deployChimeraMigration(oldCards: string, newCards: string) {
    console.log('*** Deploying Chimera Migration ***');
    const contract = await new ChimeraMigrationFactory(this.wallet).deploy(
      oldCards,
      newCards,
      580732,
    );
    return contract.address;
  }
}
