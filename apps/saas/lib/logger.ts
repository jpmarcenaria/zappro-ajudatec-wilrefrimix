type LogLevel = 'info' | 'warn' | 'error';

export const logger = {
    error(context: string, error: Error, metadata?: Record<string, any>) {
        console.error(JSON.stringify({
            level: 'error',
            context,
            message: error.message,
            metadata: { ...metadata, stack: error.stack },
            timestamp: new Date().toISOString()
        }));
    },

    warn(context: string, message: string, metadata?: Record<string, any>) {
        console.warn(JSON.stringify({
            level: 'warn',
            context,
            message,
            metadata,
            timestamp: new Date().toISOString()
        }));
    },

    info(context: string, message: string, metadata?: Record<string, any>) {
        console.log(JSON.stringify({
            level: 'info',
            context,
            message,
            metadata,
            timestamp: new Date().toISOString()
        }));
    }
};
