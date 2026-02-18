import { ValidationError } from "../errors.js";
import type { SigilHttpClient } from "../http.js";

function notImplemented() {
    throw new ValidationError(
        "Governance MCP actions are not implemented yet. Backend governance APIs are required.",
    );
}

export function createGovernanceModule(_http: SigilHttpClient) {
    return {
        listProposals() {
            notImplemented();
        },
        vote() {
            notImplemented();
        },
    };
}
