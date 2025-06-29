const { NexusWA } = require('./core/bot');
const logger = require('./core/logger');

async function main() {
    try {
        logger.info('🚀 Starting NexusWA...');
        
        const bot = new NexusWA();
        await bot.initialize();
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('🛑 Received SIGINT, shutting down gracefully...');
            await bot.shutdown();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('🛑 Received SIGTERM, shutting down gracefully...');
            await bot.shutdown();
            process.exit(0);
        });

    } catch (err) {
        logger.error("💥 Failed to start NexusWA:", err);
        console.error(err);
    }
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    // Don't exit the process, just log the error
});

main();
