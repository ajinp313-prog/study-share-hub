/**
 * Production-safe logger.
 *
 * In development (import.meta.env.DEV === true) all methods behave exactly
 * like their console counterparts.  In production builds Vite tree-shakes the
 * dev branches away, so no internal error detail is ever surfaced to end-users
 * through DevTools.
 */

const isDev = import.meta.env.DEV;

const logger = {
    /** Log informational messages (dev only). */
    log: (...args: unknown[]): void => {
        if (isDev) console.log(...args);
    },

    /** Log warnings (dev only). */
    warn: (...args: unknown[]): void => {
        if (isDev) console.warn(...args);
    },

    /**
     * Log errors.
     * In production the raw error is NOT forwarded to the console.
     * Pass a safe `userMessage` if you want production-visible breadcrumbs
     * (sent to an error-monitoring service, for example).
     */
    error: (userMessage: string, ...devArgs: unknown[]): void => {
        if (isDev) {
            console.error(`[ERROR] ${userMessage}`, ...devArgs);
        }
        // TODO: forward `userMessage` to Sentry / Datadog / etc. here when ready.
    },

    /** Debug-level output (dev only). */
    debug: (...args: unknown[]): void => {
        if (isDev) console.debug(...args);
    },
};

export default logger;
