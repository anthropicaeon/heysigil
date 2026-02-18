export class SigilError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SigilError";
    }
}

export class ApiError extends SigilError {
    readonly status: number;
    readonly details?: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export class AuthError extends SigilError {
    constructor(message = "Authentication required") {
        super(message);
        this.name = "AuthError";
    }
}

export class ValidationError extends SigilError {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}
