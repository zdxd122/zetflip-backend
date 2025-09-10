require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const Account = require("./models/account");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const indexRouter = require("./routes/index");
const { initSocket, getIO } = require("./utils/socket");
const { Webhook } = require("discord-webhook-node");
const { MONGODB_URI } = require("./config");
const http = require("http");
const compression = require("compression");
const utils = require("./utils/events");
const Bot = require("./models/bot");
const { cleanupOldMessages } = require("./controllers/chat/chatController");
const withdrawCryptoHook = new Webhook(
  "https://discord.com/api/webhooks/1225837252706435243/ZVzyp0IAPNI23MHJJ9IhcYbOX71vxrJei0exfIT09grKGVJlGuf-2kNV-DmoDmY1F-vY"
);
withdrawCryptoHook.setUsername("BLOXPVP");
withdrawCryptoHook.setAvatar(
  "https://s3-alpha-sig.figma.com/img/2b34/f172/b5c4249c2ed513c73212e742814f4b54?Expires=1711324800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=Vpjq2og4gzlTx9nsXfXmBo9FYg3ZkHzKSVKf5gejUHqvUUSJLQpFaYLYowTYFB~gJ32aPnVwnrwP~oqKz2gmcrfjBleISf2gdDhXRdHWAc~mDfU33sf3Y6fKYww1pfkEjC17RAWHV60TUwmjauNfPG1-6jTOjYYwUO-X4nS7Dz1tr9OWjDYe2jAccfV4mApd83RFYASsJbnDNqbd7BCfAbiFR8VKe2jmsSBavksA~cBSWpNb4W4f7Udw7GzRgTTyjSodO3XFDxOiuYbsNHc-cTFa~7AIei7bYzibtLXQM09NXZBKhirk6jUhqb9tHvTiwF37jYYXepZemEmnTyz7qw__"
);

const app = express();

const socketServer = http.createServer(app);
initSocket(socketServer);

mongoose.set("strictQuery", false);
const mongoDB = MONGODB_URI;

main().catch((err) => console.log(err));
async function main() {
  try {
    await mongoose.connect(mongoDB, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log('MongoDB connected successfully');

    // Create sample MM2 bots if they don't exist
    await createSampleBots();
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

async function createSampleBots() {
  try {
    // Check if MM2 bots already exist
    const existingMM2Bots = await Bot.countDocuments({ game: "MM2" });

    if (existingMM2Bots === 0) {
      console.log('Creating sample MM2 bots...');

      const sampleMM2Bots = [
        {
          robloxId: "123456789",
          username: "BLOXPVP_Bot1",
          thumbnail: "https://www.roblox.com/headshot-thumbnail/image?userId=123456789&width=420&height=420&format=png",
          privateServer: "https://www.roblox.com/games/142823291/Murder-Mystery-2",
          status: "Online",
          game: "MM2"
        },
        {
          robloxId: "987654321",
          username: "BLOXPVP_Bot2",
          thumbnail: "https://www.roblox.com/headshot-thumbnail/image?userId=987654321&width=420&height=420&format=png",
          privateServer: "https://www.roblox.com/games/142823291/Murder-Mystery-2",
          status: "Online",
          game: "MM2"
        },
        {
          robloxId: "456789123",
          username: "BLOXPVP_Bot3",
          thumbnail: "https://www.roblox.com/headshot-thumbnail/image?userId=456789123&width=420&height=420&format=png",
          privateServer: "https://www.roblox.com/games/142823291/Murder-Mystery-2",
          status: "Offline",
          game: "MM2"
        }
      ];

      await Bot.insertMany(sampleMM2Bots);
      console.log(`✅ Created ${sampleMM2Bots.length} sample MM2 bots`);
    } else {
      console.log(`ℹ️  MM2 bots already exist (${existingMM2Bots} found)`);
    }

    // Create admin endpoint for updating bots
    await createBotManagementEndpoints();

    // Start chat cleanup scheduler (every 3 hours)
    startChatCleanupScheduler();
  } catch (error) {
    console.error('Error creating sample bots:', error);
  }
}

async function startChatCleanupScheduler() {
  console.log('🧹 Starting chat cleanup scheduler (every 3 hours)');

  // Run cleanup immediately on startup
  const initialCleanup = await cleanupOldMessages();
  if (initialCleanup > 0) {
    console.log(`🧹 Initial cleanup: Deleted ${initialCleanup} old messages`);
  }

  // Schedule cleanup every 3 hours (3 * 60 * 60 * 1000 = 10,800,000 ms)
  setInterval(async () => {
    try {
      const deletedCount = await cleanupOldMessages();
      if (deletedCount > 0) {
        console.log(`🧹 Scheduled cleanup: Deleted ${deletedCount} messages older than 3 hours`);
      }
    } catch (error) {
      console.error('Error during scheduled chat cleanup:', error);
    }
  }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds

  console.log('✅ Chat cleanup scheduler started successfully');
}

function createBotManagementEndpoints() {
  // POST /admin/bots/update - Update bot information
  app.post('/admin/bots/update', async (req, res) => {
    try {
      const { robloxId, username, privateServer, status, game } = req.body;

      if (!robloxId || !username || !privateServer || !game) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const thumbnail = `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=420&height=420&format=png`;

      const updatedBot = await Bot.findOneAndUpdate(
        { robloxId, game },
        {
          username,
          thumbnail,
          privateServer,
          status: status || 'Online',
          game
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Updated bot: ${username} (${game})`);
      res.json({ success: true, bot: updatedBot });
    } catch (error) {
      console.error('Error updating bot:', error);
      res.status(500).json({ error: 'Failed to update bot' });
    }
  });

  // GET /admin/bots - Get all bots
  app.get('/admin/bots', async (req, res) => {
    try {
      const bots = await Bot.find({});
      res.json(bots);
    } catch (error) {
      console.error('Error fetching bots:', error);
      res.status(500).json({ error: 'Failed to fetch bots' });
    }
  });

  console.log('🤖 Bot management endpoints created:');
  console.log('   POST /admin/bots/update - Update bot info');
  console.log('   GET /admin/bots - Get all bots');
}

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(cors());

app.use(
  bodyParser.json({
    verify: (req, res, buf) => (req.rawBody = buf),
  })
);

app.post("/withdraw/callback", [
  body("status").escape().trim(),
  body("price").escape().trim(),
  body("currency").escape().trim(),
  body("trackId").escape().trim(),
  body("address").escape().trim(),
  rateLimit({
    limit: 15,
    windowMs: 2 * 60 * 1000,
    legacyHeaders: false,
  }),
  async (req, res) => {
    const hmacReceived = req.headers["hmac"];
    const rawBody = req.rawBody.toString();
    const calculatedHmac = crypto
      .createHmac("sha512", process.env.PAYOUT_API_KEY)
      .update(rawBody)
      .digest("hex");

    if (hmacReceived == null || hmacReceived != calculatedHmac) {
      console.error("Invalid HMAC signature", hmacReceived, calculatedHmac);
      return res.status(400).send("Invalid HMAC signature");
    }

    const notification = JSON.parse(rawBody);

    if (notification.status === "Complete") {
      try {
        const account = await Account.findOne({
          withdrawalWalletAddresses: notification.address,
        });
        if (!account) {
          console.error(
            "No account found for this withdrawal address:",
            notification.address
          );
          return res.status(404).send("Account not found");
        }

        console.log("Withdrawal processed for account:", account._id);
        withdrawCryptoHook.send(
          `${notification?.currency} withdrawal processed (User: ${
            account.username
          } - ${account.robloxId}) (Amount: $${
            Math.round(Number(notification.price) * 100) / 100
          })`
        );
        res.status(200).send("Withdrawal processed successfully");
      } catch (error) {
        console.error("Error processing withdrawal:", error);
        res.status(500).json({
          success: false,
          message: "An error occurred while processing the withdrawal.",
        });
      }
    } else {
      console.log(
        `Withdrawal status ${notification.status} for transaction:`,
        notification.trackId
      );
      res.status(200).send("OK");
    }
  },
]);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("short"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

socketServer.listen(6565, () => {
  console.log("Socket is running on port 6565");
});

function emitEvent(eventName, data) {
  io.emit(eventName, data);
}

module.exports = emitEvent;
module.exports = app;
