/**
 * ERC-20 Approval
 *
 * Handles token approval for swap contracts.
 */

import { ethers, type Wallet } from "ethers";

const ERC20_ABI = [
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
];

/**
 * Ensure the wallet has approved enough tokens for the swap.
 * If not, approve max uint256 for convenience.
 *
 * @param wallet - The wallet to use for approval
 * @param tokenAddress - The ERC-20 token contract address
 * @param spender - The contract that needs approval (allowanceTarget)
 * @param amount - The amount needed (in smallest units)
 */
export async function ensureApproval(
    wallet: Wallet,
    tokenAddress: string,
    spender: string,
    amount: bigint,
): Promise<void> {
    const erc20 = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    const currentAllowance = await erc20.allowance(wallet.address, spender);
    if (currentAllowance < amount) {
        const approveTx = await erc20.approve(spender, ethers.MaxUint256);
        await approveTx.wait(1);
    }
}
