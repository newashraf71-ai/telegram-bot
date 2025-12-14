const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const os = require("os");

// ================= CONFIG =================

const BOT_TOKEN = "8388344402:AAHhair7ma_imBXAoOCwM1vKhUnuAa3F4S8";
const CHANNEL_ID = "@TamilVipPrediction";
const ADMINS = [8171102858]; // SUPER ADMINS

const HISTORY_API =
  "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

const REGISTER_LINK =
  "https://jalwa-gameapp3.com/#/register?invitationCode=845757288532";

const PREDICTION_PHOTO = "AgACAgUAAxkBAAOWaT51TSWrXNQ7-_a4ypNcKTseazMAAoULaxvKtflVQKgxBf-bqrQBAAMCAAN4AAM2BA";

// ================= STATE =================

let BOT_ENABLED = false;
let MAINTENANCE_MODE = false;
let START_TIME = Date.now();

let lastSentMinute = null;
let cachedPrediction = "BIG";
let currentPeriod = null;

let waitingResult = false;
let predictedPeriod = null;
let predictedValue = null;

let lossCount = 0;
const BASE_PRICE = 10;

// ================= BOT INIT =================

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ================= UTILS =================

function isAdmin(id) {
  return ADMINS.includes(id);
}

function uptime() {
  const sec = Math.floor((Date.now() - START_TIME) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

// ================= LOGIC =================

function calculatePrediction(history) {
  let big = 0;
  history.slice(0, 3).forEach((i) => {
    if (parseInt(i.number) >= 5) big++;
  });
  return big >= 2 ? "BIG" : "SMALL";
}

function nextPeriod(p) {
  return String(parseInt(p) + 1);
}

function getMultiplyAndPrice() {
  const multiply = 2 ** lossCount;
  const price = BASE_PRICE * multiply;
  return { multiply, price };
}

// ================= API =================

async function fetchHistory() {
  const res = await axios.get(HISTORY_API, { timeout: 6000 });
  return res.data;
}

async function updatePrediction() {
  const data = await fetchHistory();
  const history = data.data.list;
  currentPeriod = history[0].issueNumber;
  cachedPrediction = calculatePrediction(history);
}

// ================= RESULT =================

async function checkResult() {
  if (!waitingResult) return;

  const data = await fetchHistory();
  const history = data.data.list;
  const latest = history[0];

  if (latest.issueNumber === predictedPeriod) {
    const actual = parseInt(latest.number) >= 5 ? "BIG" : "SMALL";
    let msg;

    if (actual === predictedValue) {
      lossCount = 0;
      msg =
        "🎉 WINNER! CONGRATULATIONS! 🎉\n\n" +
        "✅ Prediction Successful\n\n" +
        `📅 Period: ${predictedPeriod}\n` +
        `🎯 Result: ${actual}\n\n` +
        "💰 Great investment! Keep winning!";
    } else {
      lossCount++;
      msg =
        "😔 Better Luck Next Time!\n\n" +
        `📅 Period: ${predictedPeriod}\n` +
        `🎯 Result: ${actual}\n\n` +
        "💪 Don't worry! Next prediction coming soon!";
    }

    await bot.sendMessage(CHANNEL_ID, msg);
    waitingResult = false;
  }
}

// ================= STATUS =================

async function sendStatus(chatId) {
  const { multiply, price } = getMultiplyAndPrice();

  const msg =
    "🤖 BOT STATUS\n\n" +
    `🟢 Bot: ${BOT_ENABLED ? "ON" : "OFF"}\n` +
    `🛠 Maintenance: ${MAINTENANCE_MODE ? "ON" : "OFF"}\n\n` +
    `📅 Period: ${currentPeriod}\n` +
    `🎯 Prediction: ${cachedPrediction}\n` +
    `📉 Loss Count: ${lossCount}\n` +
    `🚀 Next Multiply: ${multiply}x\n` +
    `💰 Next Price: ${price}\n\n` +
    `⏱ Uptime: ${uptime()}\n` +
    `🖥 Server: ${os.hostname()}`;

  await bot.sendMessage(chatId, msg);
}

// ================= COMMANDS =================

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const text = msg.text.toLowerCase();
  const userId = msg.from.id;

  if (text === "/status") {
    await sendStatus(msg.chat.id);
    return;
  }

  if (!isAdmin(userId)) return;

  if (text === "/on") {
    BOT_ENABLED = true;
    MAINTENANCE_MODE = false;
    bot.sendMessage(msg.chat.id, "✅ Bot ON");
  }

  if (text === "/off") {
    BOT_ENABLED = false;
    bot.sendMessage(msg.chat.id, "⛔ Bot OFF");
  }

  if (text === "/maintenance_on") {
    MAINTENANCE_MODE = true;
    bot.sendMessage(msg.chat.id, "🛠 Maintenance ON");

    bot.sendMessage(
      CHANNEL_ID,
      "🛠 BOT MAINTENANCE NOTICE\n\n" +
        "⚠️ Bot is temporarily under maintenance.\n" +
        "⏳ Please wait.\n\n🙏 Thanks!"
    );
  }

  if (text === "/maintenance_off") {
    MAINTENANCE_MODE = false;
    bot.sendMessage(msg.chat.id, "✅ Maintenance OFF");

    bot.sendMessage(
      CHANNEL_ID,
      "✅ BOT IS LIVE NOW!\n\n🚀 Predictions resumed.\n🔥 Good luck!"
    );
  }

  if (text.startsWith("/broadcast ")) {
    const msgText = msg.text.replace("/broadcast ", "");
    bot.sendMessage(CHANNEL_ID, msgText);
    bot.sendMessage(msg.chat.id, "📢 Broadcast sent");
  }

  if (text === "/restart") {
    bot.sendMessage(msg.chat.id, "🔄 Restarting bot...");
    process.exit(0);
  }
});

// ================= MAIN LOOP =================

async function exactMinuteLoop() {
  try {
    await checkResult();
  } catch {}

  if (!BOT_ENABLED || MAINTENANCE_MODE) {
    setTimeout(exactMinuteLoop, 500);
    return;
  }

  const now = new Date();
  if (now.getSeconds() === 0) {
    const key =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");

    if (key !== lastSentMinute) {
      lastSentMinute = key;

      try {
        await updatePrediction();

        predictedPeriod = nextPeriod(currentPeriod);
        predictedValue = cachedPrediction;
        waitingResult = true;

        const { multiply, price } = getMultiplyAndPrice();

        const caption =
          "🚀 AI PREDICTION BOT\n\n" +
          `📅 Period :- \`${predictedPeriod}\`\n` +
          `🎲 Invest :- ${predictedValue}\n` +
          `🚀 Multiply :- ${multiply}x\n` +
          `💰 Purchase Price :- ${price}\n\n` +
          `👉 [Register & Get Bonus 🎁](${REGISTER_LINK})`;

        await bot.sendPhoto(CHANNEL_ID, PREDICTION_PHOTO, {
          caption,
          parse_mode: "Markdown",
        });
      } catch (e) {
        console.log("Error:", e.message);
      }
    }
  }

  setTimeout(exactMinuteLoop, 100);
}

// ================= START =================

console.log("🚀 Business Bot Started");
exactMinuteLoop();
