type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

export class Logger {
    constructor(
        private readonly level: Level,
        private readonly label = "sigilbot",
    ) {}

    debug(message: string, data?: unknown): void {
        this.log("debug", message, data);
    }

    info(message: string, data?: unknown): void {
        this.log("info", message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log("warn", message, data);
    }

    error(message: string, data?: unknown): void {
        this.log("error", message, data);
    }

    private log(level: Level, message: string, data?: unknown): void {
        if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;

        const payload = {
            level,
            label: this.label,
            ts: new Date().toISOString(),
            message,
            ...(data !== undefined ? { data } : {}),
        };

        // eslint-disable-next-line no-console
        console.error(JSON.stringify(payload));
    }
}
