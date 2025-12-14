import os
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_ID = int(os.environ.get("ADMIN_ID"))

bot_active = True

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not bot_active:
        return
    await update.message.reply_text("🤖 Bot is running 24×7!")

async def on(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global bot_active
    if update.effective_user.id == ADMIN_ID:
        bot_active = True
        await update.message.reply_text("✅ Bot ON")

async def off(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global bot_active
    if update.effective_user.id == ADMIN_ID:
        bot_active = False
        await update.message.reply_text("⛔ Bot OFF")

async def maintenance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id == ADMIN_ID:
        await update.message.reply_text("🛠 Maintenance mode enabled")

app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CommandHandler("start", start))
app.add_handler(CommandHandler("on", on))
app.add_handler(CommandHandler("off", off))
app.add_handler(CommandHandler("maintenance", maintenance))

app.run_polling()
