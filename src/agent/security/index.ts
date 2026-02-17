/**
 * Agent Security Pipeline
 *
 * Composable security layer for agent actions.
 * Runs checks before action execution.
 */

// Types
export type { SecurityCheck, SecurityContext, SecurityResult } from "./types.js";

// Pipeline
export { SecurityPipeline, createPipeline, type PipelineResult } from "./pipeline.js";

// Pre-built checks
export {
    createPromptInjectionCheck,
    createAddressScreenCheck,
    createTokenScreenCheck,
} from "./checks/index.js";

// ─── Default Pipeline ───────────────────────────────────

import { createPipeline } from "./pipeline.js";
import { createPromptInjectionCheck } from "./checks/prompt-injection.js";
import { createAddressScreenCheck } from "./checks/address-screen.js";
import { createTokenScreenCheck } from "./checks/token-screen.js";

/**
 * Create the default security pipeline with all standard checks.
 */
export function createDefaultPipeline() {
    return createPipeline()
        .add(createPromptInjectionCheck())
        .add(createAddressScreenCheck())
        .add(createTokenScreenCheck());
}

// Singleton default pipeline
let defaultPipeline: ReturnType<typeof createDefaultPipeline> | null = null;

/**
 * Get the default security pipeline (singleton).
 */
export function getDefaultPipeline() {
    if (!defaultPipeline) {
        defaultPipeline = createDefaultPipeline();
    }
    return defaultPipeline;
}
