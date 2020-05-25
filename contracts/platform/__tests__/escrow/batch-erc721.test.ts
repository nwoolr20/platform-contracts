import { Blockchain, expectRevert, Ganache, generatedWallets } from '@imtbl/test-utils';
import { ethers } from 'ethers';
import 'jest';
import { Escrow, MaliciousBatchPack, TestBatchPack, TestBatchToken, TestERC20Token, TestERC721Token } from '../../src/contracts';

const provider = new Ganache(Ganache.DefaultOptions);
const blockchain = new Blockchain(provider);

jest.setTimeout(600000);
ethers.errors.setLogLevel('error');

describe('BatchERC271Escrow', () => {
  const [user, other] = generatedWallets(provider);

  beforeEach(async () => {
    await blockchain.resetAsync();
    await blockchain.saveSnapshotAsync();
  });

  afterEach(async () => {
    await blockchain.revertAsync();
  });

  async function checkBalance(token: TestERC721Token, address: string, expected: number) {
    const balance = await token.balanceOf(address);
    expect(balance.toNumber()).toBe(expected);
  }

  describe('#constructor', () => {
    it('should be able to deploy the escrow contract', async () => {
      const escrow = await Escrow.deploy(user);
    });
  });

  describe('#escrow', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;
    let erc20: TestERC20Token;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
      erc20 = await TestERC20Token.deploy(user);
    });

    it('should be able able to escrow', async () => {
      await erc721.mint(user.address, 1);
      await checkBalance(erc721, user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await escrow.escrow(vault, user.address);
    });

    it('should not be able to escrow no tokens', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 0,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow invalid range', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 10,
        highTokenID: 0,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow null asset', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: ethers.constants.AddressZero,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow null releaser', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: ethers.constants.AddressZero,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow with erc20s', async () => {
      const len = 10;
      await erc721.mint(user.address, len);
      await erc20.mint(user.address, 50);
      await checkBalance(erc721, user.address, len);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 50,
        lowTokenID: 0,
        highTokenID: len,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow with list', async () => {
      const len = 10;
      await erc721.mint(user.address, len);
      await checkBalance(erc721, user.address, len);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 5,
        tokenIDs: [5, 6, 7, 8, 9],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should be able to escrow 10 tokens', async () => {
      const len = 10;
      await erc721.mint(user.address, len);
      await checkBalance(erc721, user.address, len);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: len,
        tokenIDs: [],
      };
      await escrow.escrow(vault, user.address);
    });

    it('should not be able to escrow unapproved tokens', async () => {
      const len = 1;
      await erc721.mint(user.address, len);
      await checkBalance(erc721, user.address, len);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });

    it('should not be able to escrow unowned tokens', async () => {
      const len = 1;
      await erc721.mint(other.address, len);
      // TODO: change owner
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: len,
        tokenIDs: [],
      };
      await expectRevert(escrow.escrow(vault, user.address));
    });
  });

  describe('#release', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
    });

    it('should not be able to release without being the releaser', async () => {
      await erc721.mint(user.address, 1);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: other.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await escrow.escrow(vault, user.address);
      await expectRevert(escrow.release(0, user.address));
    });

    it('should release correctly', async () => {
      await erc721.mint(user.address, 1);
      await checkBalance(erc721, user.address, 1);
      await checkBalance(erc721, escrow.address, 0);
      await erc721.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: erc721.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: 1,
        tokenIDs: [],
      };
      await escrow.escrow(vault, user.address);
      await checkBalance(erc721, user.address, 0);
      await checkBalance(erc721, escrow.address, 1);
      await escrow.release(0, user.address);
      await checkBalance(erc721, user.address, 1);
      await checkBalance(erc721, escrow.address, 0);
    });

  });

  describe('#release BatchToken', () => {
    
    let escrow: Escrow;
    let batch: TestBatchToken;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      batch = await TestBatchToken.deploy(user, 1250);
      await escrow.setBatchTransferEnabled(batch.address, true);
    });

    it('should release medium batch', async () => {
      const size = 120;
      await batch.mint(user.address, size);
      await checkBalance(batch, user.address, size);
      await checkBalance(batch, escrow.address, 0);
      await batch.setApprovalForAll(escrow.address, true);
      const vault = {
        player: user.address,
        admin: user.address,
        asset: batch.address,
        balance: 0,
        lowTokenID: 0,
        highTokenID: size,
        tokenIDs: [],
      };
      await escrow.escrow(vault, user.address);
      await checkBalance(batch, user.address, 0);
      await checkBalance(batch, escrow.address, size);
      const tx = await escrow.release(0, user.address);
      const receipt = await tx.wait();
      console.log(receipt.gasUsed.toNumber());
      await checkBalance(batch, user.address, size);
      await checkBalance(batch, escrow.address, 0);
    });
  });

  describe('#callbackEscrow', () => {
    let escrow: Escrow;
    let erc721: TestERC721Token;
    let malicious: MaliciousBatchPack;
    let pack: TestBatchPack;

    beforeEach(async () => {
      escrow = await Escrow.deploy(user);
      erc721 = await TestERC721Token.deploy(user);
      malicious = await MaliciousBatchPack.deploy(user, escrow.address, erc721.address);
      pack = await TestBatchPack.deploy(user, escrow.address, erc721.address);
    });

    it('should be able to create a vault using a callback', async () => {
      await pack.purchase(5);
    });

    it('should not be able to create a push escrow vault in the callback', async () => {
      await expectRevert(malicious.maliciousPush(5));
    });

    it('should not be able to create a pull escrow vault in the callback', async () => {
      await expectRevert(malicious.maliciousPull(5));
    });
  });
});
