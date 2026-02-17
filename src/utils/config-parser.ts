/**
 * Config File Parser
 *
 * Parse simple key=value format files.
 */

/**
 * Parse a key=value format config file and extract specified keys.
 */
export function parseConfigFile(
    content: string,
    keys: string[],
): Record<string, string | undefined> {
    const lines = content.split("\n").map((l) => l.trim());
    return Object.fromEntries(
        keys.map((key) => {
            const line = lines.find((l) => l.startsWith(`${key}=`));
            return [key, line?.split("=")[1]?.trim()];
        }),
    );
}
