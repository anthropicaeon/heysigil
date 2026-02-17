/**
 * useVerificationService
 *
 * Hook for verification operations with dependency injection support.
 * Enables testing by allowing service substitution.
 */

import { useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { ChallengeResponse, CheckResult, ClaimResult } from "@/types";

/**
 * Verification service interface for DI
 */
export interface IVerificationService {
    createChallenge: (method: string, projectId: string, walletAddress: string) => Promise<ChallengeResponse>;
    checkVerification: (verificationId: string) => Promise<CheckResult>;
    createAttestation: (verificationId: string) => Promise<ClaimResult>;
}

/**
 * Default service implementation using apiClient
 */
const defaultService: IVerificationService = {
    createChallenge: apiClient.verify.createChallenge,
    checkVerification: apiClient.verify.checkVerification,
    createAttestation: apiClient.claim.createAttestation,
};

interface UseVerificationServiceOptions {
    service?: IVerificationService;
}

/**
 * Hook for verification operations.
 * Accepts optional service for testing/mocking.
 */
export function useVerificationService(options: UseVerificationServiceOptions = {}) {
    const service = options.service ?? defaultService;

    const createChallenge = useCallback(
        (method: string, projectId: string, walletAddress: string) =>
            service.createChallenge(method, projectId, walletAddress),
        [service]
    );

    const checkVerification = useCallback(
        (verificationId: string) => service.checkVerification(verificationId),
        [service]
    );

    const createAttestation = useCallback(
        (verificationId: string) => service.createAttestation(verificationId),
        [service]
    );

    return {
        createChallenge,
        checkVerification,
        createAttestation,
    };
}
