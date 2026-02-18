import type {
    VerifyChallengeRequest,
    VerifyChallengeResponse,
    VerifyCheckRequest,
    VerifyCheckResponse,
} from "../types.js";
import type { SigilHttpClient } from "../http.js";

export function createVerifyModule(http: SigilHttpClient) {
    return {
        createChallenge(input: VerifyChallengeRequest) {
            return http.post<VerifyChallengeResponse>("/api/verify/challenge", input);
        },
        check(input: VerifyCheckRequest) {
            return http.post<VerifyCheckResponse>("/api/verify/check", input);
        },
        status(verificationId: string) {
            return http.get<Record<string, unknown>>(`/api/verify/status/${verificationId}`);
        },
        list() {
            return http.get<Record<string, unknown>>("/api/verify");
        },
        detail(verificationId: string) {
            return http.get<Record<string, unknown>>(`/api/verify/${verificationId}`);
        },
    };
}
