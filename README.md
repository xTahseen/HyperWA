# HyperWa Userbot 🚀

Advanced WhatsApp Userbot with Telegram Bridge, Smart Command Processing, and Modular Architecture.

## ✨ Features

### 🎯 Core Features
- **Modular Architecture** - Load/unload modules dynamically
- **QR Code to Telegram** - Automatically sends QR codes to Telegram for easy scanning
- **Smart Command Processing** - Automatic emoji reactions to commands (⏳ → ✅/❌), 
                                 Processing messages get edited with final results.
- **Telegram Bridge** - Full bidirectional sync between WhatsApp and Telegram
- **Rate Limiting** - Prevent spam and abuse
- **Database Integration** - MongoDB for persistent data
- **Contact Syncing** - Sync WhatsApp contacts with Telegram topics
- **Media Support** - Full media sync between platforms
- **Error Handling** - Comprehensive error handling with user feedback

## 🛡️ Security Features

### Rate Limiting
- Maximum commands per minute per user
- Automatic cooldown periods
- Configurable limits

### Permission System
- Owner-only commands
- Public/private mode toggle
- User blocking system

### Input Validation
- Command parameter validation
- File type restrictions
- Domain whitelisting for downloads

## 🎭 Smart Processing Features

### Auto Reactions
Commands automatically get reactions:
- ⏳ When command starts processing
- ✅ When command completes successfully
- ❌ When command fails
- ❓ For unknown commands

### Message Editing
Processing messages are automatically edited with results:
1. User sends command
2. Bot reacts with ⏳ and sends "Processing..." message
3. Command executes
4. Processing message gets edited with final result
5. Bot reacts with ✅ or ❌


## 🔗 Telegram Bridge Features

### QR Code Sharing
- Automatically sends WhatsApp QR codes to Telegram
- Easy scanning without terminal access
- Supports reconnection QR codes

### Message Syncing
- All WhatsApp messages sync to Telegram topics
- Media files are forwarded
- Contact information is preserved
- Status updates are synced

### Bidirectional Communication
- Send messages from Telegram to WhatsApp
- Reply to WhatsApp messages via Telegram
- Media forwarding in both directions

## 📊 Database Collections

### Bridge Data
```javascript
// Chat mappings
{
    type: 'chat',
    data: {
        whatsappJid: '1234567890@s.whatsapp.net',
        telegramTopicId: 123,
        createdAt: Date,
        lastActivity: Date
    }
}

// User mappings
{
    type: 'user',
    data: {
        whatsappId: '1234567890@s.whatsapp.net',
        name: 'John Doe',
        phone: '1234567890',
        firstSeen: Date,
        messageCount: 42
    }
}

// Contact mappings
{
    type: 'contact',
    data: {
        phone: '1234567890',
        name: 'John Doe',
        updatedAt: Date
    }
}
```
## 🎮 Commands

### Core Commands
- `.ping` - Check bot response time
- `.status` - Show bot status and statistics
- `.help` - Show all available commands
- `.help <module>` - Show detailed module help

### Module Management
- `.lm` - Load module (reply to .js file)
- `.ulm <module>` - Unload module
- `.rlm <module>` - Reload module
- `.modules` - List all loaded modules

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hyperwa
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure the bot**
Edit `config.js` with your settings:
- MongoDB URI
- Telegram Bot Token
- Telegram Chat ID
- API Keys (optional)

4. **Start the bot**
```bash
npm start
```

## ⚙️ Configuration

### Bot Settings
```javascript
bot: {
    name: 'HyperWa Userbot',
    company: 'HyperWa Technologies',
    prefix: '.',
    version: '3.0.0'
}
```

### Features Toggle
```javascript
features: {
    mode: 'public', // public or private
    autoViewStatus: true,
    customModules: true,
    rateLimiting: true,
    smartProcessing: true, // Enhanced command processing
    autoReact: true, // Auto react to commands
    editMessages: true // Edit processing messages
}
```

### Telegram Bridge
```javascript
telegram: {
    enabled: true,
    botToken: 'YOUR_BOT_TOKEN',
    chatId: 'YOUR_CHAT_ID',
    sendQRCode: true, // Send QR codes to Telegram
    features: {
        topics: true,
        mediaSync: true,
        profilePicSync: true,
        callLogs: true,
        statusSync: true,
        biDirectional: true
    }
}
```
## 🚀 Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start index.js --name "hyperwa"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

1. **QR Code not appearing**
   - Check Telegram bot token and chat ID
   - Ensure bot has permission to send photos

2. **Commands not working**
   - Verify prefix in config
   - Check command permissions
   - Review rate limiting settings

3. **Database connection failed**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database exists

4. **Telegram bridge not working**
   - Verify bot token and chat ID
   - Check if bot is added to the chat
   - Review Telegram API limits


## 🔧 Creating Modules

### Basic Module Structure
```javascript
class ExampleModule {
    constructor(bot) {
        this.bot = bot;
        this.name = 'example';
        this.metadata = {
            description: 'Example module for demonstration',
            version: '1.0.0',
            author: 'Your Name',
            category: 'utility'
        };
        this.commands = [
            {
                name: 'example',
                description: 'Example command',
                usage: '.example <text>',
                permissions: 'public',
                ui: {
                    processingText: '⏳ *Processing Example...*\n\n🔄 Working on your request...',
                    errorText: '❌ *Example Failed*'
                },
                execute: this.exampleCommand.bind(this)
            }
        ];
    }

    async exampleCommand(msg, params, context) {
        // Your command logic here
        const result = `✅ *Example Result*\n\nInput: ${params.join(' ')}`;
        return result; // This will replace the processing message
    }

    // Optional: Initialize module
    async init() {
        console.log('Example module initialized');
    }

    // Optional: Cleanup on unload
    async destroy() {
        console.log('Example module destroyed');
    }
}

module.exports = ExampleModule;
```

### Database Integration in Modules
```javascript
class DatabaseModule {
    constructor(bot) {
        this.bot = bot;
        this.db = null;
        this.collection = null;
    }

    async init() {
        // Get database connection
        this.db = this.bot.db;
        this.collection = this.db.collection('my_module_data');
        
        // Create indexes
        await this.collection.createIndex({ userId: 1 });
    }

    async saveUserData(userId, data) {
        await this.collection.updateOne(
            { userId },
            { $set: { ...data, updatedAt: new Date() } },
            { upsert: true }
        );
    }

    async getUserData(userId) {
        return await this.collection.findOne({ userId });
    }
}
```

### Message Hooks
```javascript
class HookModule {
    constructor(bot) {
        this.bot = bot;
        this.messageHooks = {
            'all': this.onAllMessages.bind(this),
            'media': this.onMediaMessages.bind(this)
        };
    }

    async onAllMessages(msg, text) {
        // Called for every message
        console.log('Message received:', text);
    }

    async onMediaMessages(msg, text) {
        // Called for media messages
        if (this.hasMedia(msg)) {
            console.log('Media message received');
        }
    }

    hasMedia(msg) {
        return !!(
            msg.message?.imageMessage ||
            msg.message?.videoMessage ||
            msg.message?.audioMessage ||
            msg.message?.documentMessage
        );
    }
}
```

### Custom UI Messages
```javascript
{
    name: 'download',
    ui: {
        processingText: '📥 *Downloading...*\n\n⏳ Please wait while I fetch your file...',
        errorText: '❌ *Download Failed*'
    },
    execute: async (msg, params, context) => {
        // Your download logic
        return '✅ *Download Complete*\n\nFile has been sent successfully!';
    }
}
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Join our Telegram group
- Check the documentation

---

**HyperWa Userbot** - Advanced WhatsApp automation with style! 🚀
