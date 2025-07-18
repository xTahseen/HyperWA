const config = require('../config');
const fs = require('fs-extra');
const path = require('path');
const helpers = require('../utils/helpers');

class CoreCommands {
    constructor(bot) {
        this.bot = bot;
        this.name = 'core';
        this.metadata = {
            description: 'Core bot commands for basic functionality',
            version: '1.0.0',
            author: 'Bot Developer',
            category: 'core',
            dependencies: []
        };
        this.commands = [
            {
                name: 'ping',
                description: 'Check bot response time',
                usage: '.ping',
                permissions: 'public',
                execute: this.ping.bind(this)
            },
            {
                name: 'status',
                description: 'Show bot status and statistics',
                usage: '.status',
                permissions: 'public',
                execute: this.status.bind(this)
            },
            {
                name: 'restart',
                description: 'Restart the bot (owner only)',
                usage: '.restart',
                permissions: 'owner',
                execute: this.restart.bind(this)
            },
            {
                name: 'sync',
                description: 'Sync contacts from WhatsApp',
                usage: '.sync',
                permissions: 'public',
                execute: this.syncContacts.bind(this)
            }
        ];
    }

    async ping(msg, params, context) {
        const start = Date.now();
        const pingMsg = await context.bot.sendMessage(context.sender, {
            text: '*Pinging...*'
        });
        
        const latency = Date.now() - start;
        
        await context.bot.sock.sendMessage(context.sender, {
            text: `*Pong!* [${latency}ms]`,
            edit: pingMsg.key
        });
    }

    async status(msg, params, context) {
        const uptime = process.uptime();
        const uptimeString = this.formatUptime(uptime);
        const memUsage = process.memoryUsage();
        
        let statusText = `*Bot Status*\n\n`;
        statusText += `*Bot:* ${config.get('bot.name')} v${config.get('bot.version')}\n`;
        statusText += `*Uptime:* ${uptimeString}\n`;
        statusText += `*Memory:* ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB\n`;
        statusText += `*WhatsApp:* ${context.bot.sock?.user ? 'Active' : 'Disconnected'}\n`;
        
        if (context.bot.telegramBridge) {
            statusText += `*Telegram Bridge:* Active\n`;
            statusText += `*Contacts:* ${context.bot.telegramBridge.contactMappings.size}\n`;
            statusText += `*Chats:* ${context.bot.telegramBridge.chatMappings.size}\n`;
        } else {
            statusText += `*Telegram Bridge:* Inactive\n`;
        }
        
        statusText += `*Modules:* ${context.bot.moduleLoader.modules.size}\n`;
        statusText += `*Commands:* ${context.bot.messageHandler.commandHandlers.size}`;

        await context.bot.sendMessage(context.sender, { text: statusText });
    }

    async restart(msg, params, context) {
        const owner = config.get('bot.owner');
        if (context.participant !== owner && !msg.key.fromMe) {
            return context.bot.sendMessage(context.sender, {
                text: 'Only the bot owner can restart the bot.'
            });
        }

        await context.bot.sendMessage(context.sender, {
            text: '*Restarting Bot*'
        });

        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }

    async syncContacts(msg, params, context) {
        if (!context.bot.telegramBridge) {
            return context.bot.sendMessage(context.sender, {
                text: '❌ Telegram bridge is not active. Cannot sync contacts.'
            });
        }

        const processingMsg = await context.bot.sendMessage(context.sender, {
            text: '⚡ *Syncing Contacts*\n\n🔄 Fetching contacts from WhatsApp...\n⏳ Please wait...'
        });

        try {
            const syncedCount = await context.bot.telegramBridge.syncContacts();
            
            await context.bot.sock.sendMessage(context.sender, {
                text: `✅ *Contact Sync Complete*\n\n📞 Synced: ${syncedCount} contacts\n📊 Total: ${context.bot.telegramBridge.contactMappings.size} contacts\n⏰ ${new Date().toLocaleTimeString()}`,
                edit: processingMsg.key
            });
        } catch (error) {
            await context.bot.sock.sendMessage(context.sender, {
                text: `❌ *Contact Sync Failed*\n\n🚫 Error: ${error.message}\n⏰ ${new Date().toLocaleTimeString()}`,
                edit: processingMsg.key
            });
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        let uptime = '';
        if (days > 0) uptime += `${days}d `;
        if (hours > 0) uptime += `${hours}h `;
        if (minutes > 0) uptime += `${minutes}m `;
        uptime += `${secs}s`;

        return uptime;
    }
}

module.exports = CoreCommands;
