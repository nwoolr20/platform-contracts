import 'jest';

import { Ganache, Blockchain, generatedWallets, expectRevert } from '@imtbl/test-utils';
import {
  Referral,
  EpicPack,
  Cards,
  Raffle
} from '../../../../src/contracts';
import { ethers } from 'ethers';
import { PurchaseProcessor, CreditCardEscrow, Escrow, Beacon } from '@imtbl/platform';
import { getSignedPayment, Currency, Order } from '@imtbl/platform';

import {
  ETHUSDMockOracle,
  getETHPayment,
} from '@imtbl/platform';
import { GU_S1_EPIC_PACK_SKU, GU_S1_EPIC_PACK_PRICE } from '../../../../deployment/constants';
import { deployStandards, StandardContracts, deployEpicPack } from '../utils';

jest.setTimeout(600000);

const provider = new Ganache(Ganache.DefaultOptions);
const blockchain = new Blockchain(provider);
const MAX_MINT = 5;
const ZERO_EX = '0x0000000000000000000000000000000000000000';

ethers.errors.setLogLevel('error');

describe('Multi-Mint Pack', () => {

  const [owner] = generatedWallets(provider);

  beforeEach(async () => {
    await blockchain.resetAsync();
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  describe('purchase USD', () => {

    let shared: StandardContracts;
    let epic: EpicPack;

    beforeAll(async() => {
      shared = await deployStandards(owner);
    });

    beforeEach(async() => {
      epic = await deployEpicPack(owner, shared);
    })

    async function purchasePacks(quantity: number) {
      const order: Order = {
        quantity, sku: GU_S1_EPIC_PACK_SKU,
        assetRecipient: owner.address,
        changeRecipient: owner.address,
        alreadyPaid: 0,
        totalPrice: GU_S1_EPIC_PACK_PRICE * quantity,
        currency: Currency.USDCents
      };
      const params = { escrowFor: 0, nonce: 0, value: GU_S1_EPIC_PACK_PRICE * quantity };
      const payment = await getSignedPayment(
         owner, shared.processor.address, epic.address, order, params
      );
      await epic.purchase(quantity, payment, ZERO_EX);
      for (let i = 0; i < quantity; i += MAX_MINT) {
        await epic.mint(0);
      }
    }

    it('should purchase max + 1 packs with USD', async () => {
      await purchasePacks(MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

    it('should purchase 2 * max + 1 packs with USD', async () => {
      await purchasePacks(2 * MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

  });

  describe('purchase ETH', () => {

    let shared: StandardContracts;
    let epic: EpicPack;

    beforeAll(async() => {
      shared = await deployStandards(owner);
    });

    beforeEach(async() => {
      epic = await deployEpicPack(owner, shared);
    });

    async function purchasePacks(quantity: number) {
      const payment = getETHPayment();
      const ethRequired = await shared.oracle.convert(1, 0, GU_S1_EPIC_PACK_PRICE * quantity);
      await epic.purchase(quantity, payment, ZERO_EX, { value: ethRequired });
      for (let i = 0; i < quantity; i += MAX_MINT) {
        await epic.mint(0);
      }
    }

    it('should purchase 6 with ETH', async () => {
      await purchasePacks(MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

    it('should purchase 11 with ETH', async () => {
      await purchasePacks(2 * MAX_MINT + 1);
      // should have minted everything
      await expectRevert(epic.mint(0));
    });

  });

});
