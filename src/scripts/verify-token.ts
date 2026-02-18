/**
 * Test: verify an already-deployed SigilToken on Basescan
 *
 * Usage: source .env && bun run src/scripts/verify-token.ts <address> <name> <symbol>
 */
import { verifyTokenOnBasescan } from "../services/contract-verifier.js";

const [address, name, symbol] = process.argv.slice(2);

if (!address || !name || !symbol) {
    console.log("Usage: bun run src/scripts/verify-token.ts <address> <name> <symbol>");
    console.log("Example: bun run src/scripts/verify-token.ts 0x1234... 'Testicular' 'sTEST'");
    process.exit(1);
}

console.log(`Verifying ${name} (${symbol}) at ${address}...`);
verifyTokenOnBasescan(address, name, symbol)
    .then(() => console.log("Done!"))
    .catch((err) => console.error("Error:", err));
