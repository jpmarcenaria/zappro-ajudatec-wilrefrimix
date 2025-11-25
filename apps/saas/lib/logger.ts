type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogData {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
    user?: string;
    trace?: string;
}

export const logger = {
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, error?: Error, data?: unknown) => {
        log('error', message, {
            ...(data as Record<string, unknown>),
            error: error?.message,
            stack: error?.stack
        });
    },
    debug: (message: string, data?: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
            log('debug', message, data);
        }
    }
};

function log(level: LogLevel, message: string, data?: unknown) {
    const logData: LogData = {
        level,
        message,
        timestamp: new Date().toISOString(),
        data
    };

    if (process.env.NODE_ENV === 'production') {
        // JSON estruturado para produção (fácil parsing por ferramentas)
        console.log(JSON.stringify(logData));
    } else {
        // Formato colorido para desenvolvimento
        const colors = {
            info: '\x1b[36m',    // Cyan
            warn: '\x1b[33m',    // Yellow
            error: '\x1b[31m',   // Red
            debug: '\x1b[90m'    // Gray
        };
        const reset = '\x1b[0m';

        console.log(
            `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`,
            data ? data : ''
        );
    }
}
