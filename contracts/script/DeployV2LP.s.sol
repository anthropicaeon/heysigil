// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SigilV2LPManager} from "../src/SigilV2LPManager.sol";

// ─── Minimal V3 Interfaces ─────────────────────────────

interface IUniswapV3Factory {
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
    function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool);
}

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
    function token0() external view returns (address);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);

    function transferFrom(address from, address to, uint256 tokenId) external;
}

/// @title DeployV2LP — V2 SIGIL Liquidity Deployment
/// @notice Creates a V3 pool, mints 5 concentrated LP positions, transfers to SigilV2LPManager.
///
///   Usage:
///     forge script script/DeployV2LP.s.sol:DeployV2LP \
///       --rpc-url $BASE_RPC_URL \
///       --private-key $PRIVATE_KEY \
///       --broadcast \
///       --verify \
///       --etherscan-api-key $BASESCAN_API_KEY
///
///   Environment:
///     V2_TOKEN — V2 SIGIL token address
contract DeployV2LP is Script {
    // ─── Base Mainnet Addresses ──────────────────────────
    address constant V3_FACTORY = 0x33128a8fC17869897dcE68Ed026d694621f6FDfD;
    address constant POSITION_MANAGER = 0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1;
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // ─── Pool Config ─────────────────────────────────────
    uint24 constant POOL_FEE = 10000; // 1% fee tier
    int24 constant TICK_SPACING = 200;
    int24 constant MIN_TICK = -887200;
    int24 constant MAX_TICK = 887200;

    // ─── Seed Config ─────────────────────────────────────
    uint256 constant SEED_AMOUNT = 1_000_000; // 1 USDC (6 decimals)

    // ─── Position Config (5 bands, anti-snipe weighted) ──
    uint256 constant NUM_POSITIONS = 5;

    function run() external {
        address v2Token = vm.envAddress("V2_TOKEN");
        address deployer = msg.sender;

        console2.log("=== V2 SIGIL LP Deployment ===");
        console2.log("Deployer:", deployer);
        console2.log("V2 Token:", v2Token);
        console2.log("Chain:   ", block.chainid);

        // Sort tokens
        (address token0, address token1, bool tokenIsToken0) = _sortTokens(v2Token, USDC);
        console2.log("Token0:  ", token0);
        console2.log("Token1:  ", token1);
        console2.log("V2 is token0:", tokenIsToken0);

        vm.startBroadcast();

        // 1. Deploy SigilV2LPManager
        SigilV2LPManager manager = new SigilV2LPManager(POSITION_MANAGER, v2Token);
        console2.log("");
        console2.log("SigilV2LPManager:", address(manager));

        // 2. Create V3 pool
        address pool = IUniswapV3Factory(V3_FACTORY).createPool(token0, token1, POOL_FEE);
        console2.log("Pool:    ", pool);

        // 3. Initialize pool at $15K mcap starting price (outside LP range)
        uint160 sqrtPriceX96 = _getStartPrice(tokenIsToken0);
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        console2.log("Pool initialized");

        // 4. Approve V2 tokens to position manager
        uint256 totalLP = _getTotalLPAmount();
        IERC20(v2Token).approve(POSITION_MANAGER, totalLP);
        console2.log("Approved:", totalLP / 1 ether, "B tokens");

        // 5. Mint 5 positions and transfer to manager
        for (uint256 i; i < NUM_POSITIONS; ++i) {
            (int24 tickLower, int24 tickUpper, uint256 tokenAmount) =
                _getPositionConfig(i, tokenIsToken0);

            (uint256 amount0Desired, uint256 amount1Desired) = tokenIsToken0
                ? (tokenAmount, uint256(0))
                : (uint256(0), tokenAmount);

            (uint256 tokenId, , , ) = INonfungiblePositionManager(POSITION_MANAGER).mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: POOL_FEE,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0Desired: amount0Desired,
                    amount1Desired: amount1Desired,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );

            console2.log("  Position", i, "minted, NFT ID:", tokenId);

            // Transfer NFT to manager
            INonfungiblePositionManager(POSITION_MANAGER).transferFrom(
                address(this), address(manager), tokenId
            );

            // Register in manager
            manager.registerPosition(tokenId);
            console2.log("  Position", i, "registered in manager");
        }

        // 6. Seed swap (1 USDC) to push price into LP range
        uint256 seedBal = IERC20(USDC).balanceOf(deployer);
        if (seedBal >= SEED_AMOUNT) {
            IERC20(USDC).approve(pool, SEED_AMOUNT);
            console2.log("");
            console2.log("Seed swap: sending", SEED_AMOUNT, "USDC to activate pool");
            // NOTE: Seed swap requires a callback. For manual deployment,
            // you may prefer to do the seed swap separately via cast or a DEX.
            // The positions are active once price enters range via any buy.
            console2.log("IMPORTANT: Do the seed swap manually via cast or DEX after deployment");
        } else {
            console2.log("");
            console2.log("WARNING: Not enough USDC for seed swap, do it manually after");
        }

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== DONE ===");
        console2.log("V2_LP_MANAGER=", address(manager));
        console2.log("POOL=", pool);
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. Verify manager + pool on Basescan");
        console2.log("  2. Do a seed swap (buy 1 USDC worth) to activate liquidity");
        console2.log("  3. Call sweepFees() on manager to collect accrued LP fees");
    }

    // ─── Position Config ─────────────────────────────────
    //
    //  Anti-snipe weighted: light at bottom, heavy in mid-range
    //
    //  | Pos | MCAP Range         | Supply  |
    //  |-----|--------------------| --------|
    //  |  0  | $15K → $26.4K      |  8.00B  |
    //  |  1  | $26.4K → $46.3K    | 11.50B  |
    //  |  2  | $46.3K → $81.4K    | 10.00B  |
    //  |  3  | $81.4K → $251.3K   |  6.32B  |
    //  |  4  | $251.3K → ∞        |  8.95B  |
    //  |     | Total              | 44.77B  |

    function _getPositionConfig(uint256 index, bool tokenIsToken0)
        internal
        pure
        returns (int24 tickLower, int24 tickUpper, uint256 tokenAmount)
    {
        // ─── Token amounts per position ────────────────────
        // Sum = 44,770,000,000 ether
        if (index == 0) tokenAmount = 8_000_000_000 ether;
        else if (index == 1) tokenAmount = 11_500_000_000 ether;
        else if (index == 2) tokenAmount = 10_000_000_000 ether;
        else if (index == 3) tokenAmount = 6_320_000_000 ether;
        else tokenAmount = 8_950_000_000 ether; // Residual to position 4

        // ─── Tick boundaries ───────────────────────────────
        // Same MCAP → tick mapping as SigilFactoryV3 (100B supply baseline)
        // Bands 3+4 from factory merged into single band 3 here
        if (tokenIsToken0) {
            // token0 = V2 SIGIL: higher MCAP → less negative tick
            if (index == 0)      { tickLower = -433600; tickUpper = -428000; }
            else if (index == 1) { tickLower = -428000; tickUpper = -422200; }
            else if (index == 2) { tickLower = -422200; tickUpper = -416600; }
            else if (index == 3) { tickLower = -416600; tickUpper = -405400; } // merged
            else                 { tickLower = -405400; tickUpper = MAX_TICK; }
        } else {
            // token1 = V2 SIGIL: mirrored ticks
            if (index == 0)      { tickLower = 427800;  tickUpper = 433400;  }
            else if (index == 1) { tickLower = 422000;  tickUpper = 427800;  }
            else if (index == 2) { tickLower = 416400;  tickUpper = 422000;  }
            else if (index == 3) { tickLower = 405200;  tickUpper = 416400;  } // merged
            else                 { tickLower = MIN_TICK; tickUpper = 405200; }
        }
    }

    function _getTotalLPAmount() internal pure returns (uint256) {
        return 8_000_000_000 ether
             + 11_500_000_000 ether
             + 10_000_000_000 ether
             + 6_320_000_000 ether
             + 8_950_000_000 ether;
    }

    function _getStartPrice(bool tokenIsToken0) internal pure returns (uint160) {
        if (tokenIsToken0) {
            // tick at -433800 (1 spacing below range)
            return 30164993233297854464;
        } else {
            // tick at +433600 (1 spacing above range)
            return uint160(206021814379242830973241408007755005952);
        }
    }

    function _sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1, bool tokenAIsToken0)
    {
        if (tokenA < tokenB) {
            token0 = tokenA;
            token1 = tokenB;
            tokenAIsToken0 = true;
        } else {
            token0 = tokenB;
            token1 = tokenA;
            tokenAIsToken0 = false;
        }
    }

    // Factory needs to be able to receive NFTs during mint → transfer flow
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
