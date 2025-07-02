const { HyperWA } = require('./Core/bot');
const logger = require('./Core/logger');

async function main() {
    try {
        logger.info('🚀 Starting HyperWA...');
        
        const bot = new HyperWA();
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
        logger.error("💥 Failed to start HyperWA:", err);
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
