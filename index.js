// index.js // Simple Telegram Bot (24x7 on Render) // Features: // - Bot ON / OFF // - Maintenance ON / OFF // - Admin only commands

const TelegramBot = require('node-telegram-bot-api');

// ================= CONFIG ================= const BOT_TOKEN = process.env.BOT_TOKEN; // Render Environment Variable const ADMIN_IDS = [8171102858]; // <-- replace with your Telegram user ID

if (!BOT_TOKEN) { console.error('BOT_TOKEN missing'); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ================= STATES ================= let BOT_ENABLED = true; let MAINTENANCE = false;

// ================= HELPERS ================= function isAdmin(id) { return ADMIN_IDS.includes(id); }

// ================= COMMANDS ================= bot.onText(//start/, (msg) => { bot.sendMessage(msg.chat.id, 🤖 Bot is online!\n\nCommands:\n/status); });

bot.onText(//status/, (msg) => { bot.sendMessage( msg.chat.id, 📊 Bot Status\n\n✅ Bot: ${BOT_ENABLED ? 'ON' : 'OFF'}\n🛠 Maintenance: ${MAINTENANCE ? 'ON' : 'OFF'} ); });

// ================= ADMIN COMMANDS ================= bot.onText(//bot_on/, (msg) => { if (!isAdmin(msg.from.id)) return; BOT_ENABLED = true; bot.sendMessage(msg.chat.id, '✅ Bot turned ON'); });

bot.onText(//bot_off/, (msg) => { if (!isAdmin(msg.from.id)) return; BOT_ENABLED = false; bot.sendMessage(msg.chat.id, '❌ Bot turned OFF'); });

bot.onText(//maintenance_on/, (msg) => { if (!isAdmin(msg.from.id)) return; MAINTENANCE = true; bot.sendMessage(msg.chat.id, '🛠 Maintenance mode ON'); });

bot.onText(//maintenance_off/, (msg) => { if (!isAdmin(msg.from.id)) return; MAINTENANCE = false; bot.sendMessage(msg.chat.id, '✅ Maintenance mode OFF'); });

// ================= MESSAGE HANDLER ================= bot.on('message', (msg) => { if (msg.text && msg.text.startsWith('/')) return; // ignore commands

if (!BOT_ENABLED) return;

if (MAINTENANCE) { bot.sendMessage(msg.chat.id, '⚠️ Bot under maintenance. Please wait.'); return; }

// Normal bot reply bot.sendMessage(msg.chat.id, 👋 Hello ${msg.from.first_name}); });

console.log('🤖 Bot started successfully');
