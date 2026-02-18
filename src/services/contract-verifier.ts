/**
 * Contract Verifier Service
 *
 * Automatically verifies SigilToken contracts on Basescan after deployment.
 * Uses the Basescan API with Solidity standard-input-JSON format.
 *
 * This is critical to avoid BlockAid security warnings that flag
 * unverified contracts as suspicious.
 */

import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";

const log = loggers.deployer;

// ─── Constants ──────────────────────────────────────────

const BASESCAN_API_URL = "https://api.etherscan.io/v2/api";
const BASE_CHAIN_ID = "8453";

// Exact compiler version expected by Basescan (must match solc list)
const COMPILER_VERSION = "v0.8.26+commit.8a97fa7a";

// Total supply used by the factory
const DEFAULT_SUPPLY = ethers.parseEther("100000000000"); // 100B tokens

// ─── SigilToken Source ──────────────────────────────────
// Embedded source for the standard-input JSON.
// Must match the deployed bytecode exactly.

const SIGIL_TOKEN_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SigilToken
/// @notice Minimal ERC-20 token deployed by SigilFactory for each project.
///         Fixed supply, no mint/burn after creation. All tokens minted to the factory
///         which places them as single-sided liquidity in the V4 pool.
contract SigilToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _recipient) {
        require(bytes(_name).length > 0, "SIGIL: EMPTY_NAME");
        require(bytes(_symbol).length > 0, "SIGIL: EMPTY_SYMBOL");
        require(_totalSupply > 0, "SIGIL: ZERO_SUPPLY");
        require(_recipient != address(0), "SIGIL: ZERO_RECIPIENT");

        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply;
        balanceOf[_recipient] = _totalSupply;
        emit Transfer(address(0), _recipient, _totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "SIGIL: ALLOWANCE");
            allowance[from][msg.sender] = allowed - amount;
        }
        return _transfer(from, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "SIGIL: FROM_ZERO");
        require(to != address(0), "SIGIL: TO_ZERO");
        require(balanceOf[from] >= amount, "SIGIL: BALANCE");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

// ─── Standard Input JSON ────────────────────────────────

function buildStandardInputJson(): string {
    const input = {
        language: "Solidity",
        sources: {
            "src/SigilToken.sol": {
                content: SIGIL_TOKEN_SOURCE,
            },
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
            evmVersion: "cancun",
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
                },
            },
        },
    };
    return JSON.stringify(input);
}

// ─── Constructor Args ───────────────────────────────────

function encodeConstructorArgs(name: string, symbol: string, factoryAddress: string): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const encoded = abiCoder.encode(
        ["string", "string", "uint256", "address"],
        [name, symbol, DEFAULT_SUPPLY, factoryAddress],
    );
    // Remove 0x prefix — Basescan expects raw hex
    return encoded.slice(2);
}

// ─── Basescan API ───────────────────────────────────────

async function submitVerification(
    apiKey: string,
    tokenAddress: string,
    constructorArgs: string,
): Promise<string> {
    const sourceCode = buildStandardInputJson();

    const params = new URLSearchParams({
        apikey: apiKey,
        module: "contract",
        action: "verifysourcecode",
        contractaddress: tokenAddress,
        sourceCode,
        codeformat: "solidity-standard-json-input",
        contractname: "src/SigilToken.sol:SigilToken",
        compilerversion: COMPILER_VERSION,
        constructorArguements: constructorArgs, // Basescan's typo, not ours
    });

    const response = await fetch(`${BASESCAN_API_URL}?chainid=${BASE_CHAIN_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data = await response.json();

    if (data.status === "1" && data.result) {
        return data.result; // GUID for checking status
    }

    throw new Error(
        `Basescan submit failed: ${data.result || data.message || JSON.stringify(data)}`,
    );
}

async function checkVerificationStatus(
    apiKey: string,
    guid: string,
): Promise<{ verified: boolean; message: string }> {
    const params = new URLSearchParams({
        apikey: apiKey,
        module: "contract",
        action: "checkverifystatus",
        guid,
    });

    const response = await fetch(
        `${BASESCAN_API_URL}?chainid=${BASE_CHAIN_ID}&${params.toString()}`,
    );
    const data = await response.json();

    if (data.result === "Pass - Verified") {
        return { verified: true, message: data.result };
    }

    if (data.result === "Pending in queue" || data.result === "Already Verified") {
        return { verified: data.result === "Already Verified", message: data.result };
    }

    // Any other result is a failure
    return { verified: false, message: data.result || "Unknown error" };
}

// ─── Public API ─────────────────────────────────────────

/**
 * Verify a SigilToken on Basescan.
 *
 * Call this after every successful factory.launch().
 * It's fire-and-forget — does not throw on failure.
 *
 * @param tokenAddress - Deployed token contract address
 * @param name - Token name (constructor arg)
 * @param symbol - Token symbol (constructor arg)
 */
export async function verifyTokenOnBasescan(
    tokenAddress: string,
    name: string,
    symbol: string,
): Promise<void> {
    const env = getEnv();
    const apiKey = env.BASESCAN_API_KEY;

    if (!apiKey) {
        log.debug({ tokenAddress }, "Skipping Basescan verification (no API key)");
        return;
    }

    const factoryAddress = env.SIGIL_FACTORY_ADDRESS;
    if (!factoryAddress) {
        log.debug({ tokenAddress }, "Skipping Basescan verification (no factory address)");
        return;
    }

    log.info({ tokenAddress, name, symbol }, "Submitting Basescan verification");

    try {
        const constructorArgs = encodeConstructorArgs(name, symbol, factoryAddress);
        const guid = await submitVerification(apiKey, tokenAddress, constructorArgs);

        log.info({ tokenAddress, guid }, "Basescan verification submitted");

        // Poll for result (max 60s, check every 5s)
        for (let i = 0; i < 12; i++) {
            await new Promise((r) => setTimeout(r, 5000));

            const status = await checkVerificationStatus(apiKey, guid);

            if (status.verified) {
                log.info(
                    { tokenAddress, message: status.message },
                    "✅ Token verified on Basescan",
                );
                return;
            }

            if (
                status.message !== "Pending in queue" &&
                !status.message.includes("Unable to locate")
            ) {
                // Hard failure — stop polling
                log.warn({ tokenAddress, message: status.message }, "Basescan verification failed");
                return;
            }
        }

        log.warn({ tokenAddress }, "Basescan verification timed out (60s)");
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.warn({ tokenAddress, err: msg }, "Basescan verification error");
    }
}
