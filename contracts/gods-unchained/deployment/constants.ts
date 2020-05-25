import { keccak256 } from 'ethers/utils';
import { ethers } from 'ethers';

export const GU_S1_CAP = 4 * 1000000 * 100; // $4m USD
export const GU_S1_LEGENDARY_CHEST_CAP = 3250;
export const GU_S1_RARE_CHEST_CAP = 8000;
export const GU_S1_MAX_MINT = 50;
export const GU_S1_RARE_PACK_PRICE = 249;
export const GU_S1_EPIC_PACK_PRICE = 699;
export const GU_S1_LEGENDARY_PACK_PRICE = 2499;
export const GU_S1_SHINY_PACK_PRICE = 14999;
export const GU_S1_RARE_CHEST_PRICE = 1799;
export const GU_S1_LEGENDARY_CHEST_PRICE = 17999;

export const GU_S1_EPIC_PACK_SKU = keccak256(ethers.utils.formatBytes32String('epic.pack'));
export const GU_S1_RARE_PACK_SKU = keccak256(ethers.utils.formatBytes32String('rare.pack'));
export const GU_S1_SHINY_PACK_SKU = keccak256(ethers.utils.formatBytes32String('shiny.pack'));
export const GU_S1_LEGENDARY_PACK_SKU = keccak256(
  ethers.utils.formatBytes32String('legendary.pack'),
);

export const GU_S1_RARE_CHEST_SKU = keccak256(ethers.utils.formatBytes32String('rare.chest'));
export const GU_S1_LEGENDARY_CHEST_SKU = keccak256(
  ethers.utils.formatBytes32String('legendary.chest'),
);

