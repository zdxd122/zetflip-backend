const asyncHandler = require("express-async-handler");
const Account = require("../../models/account");
const Message = require("../../models/message");
const Giveaway = require("../../models/giveaway");
const GiveawayEntry = require("../../models/giveawayEntry");
const Item = require("../../models/item");
const { getOnlineCount, emitEvent } = require("../../utils/events");

exports.send_message = [
  asyncHandler(async (req, res, next) => {
    try {
      // Simple inline validation
      const message = req.body.message?.trim();

      if (!message) {
        return res.status(400).json({ errors: [{ msg: "Message cannot be empty" }] });
      }

      if (message.length < 1) {
        return res.status(400).json({ errors: [{ msg: "Message must be at least 1 character" }] });
      }

      if (message.length > 100) {
        return res.status(400).json({ errors: [{ msg: "Message cannot be longer than 100 characters" }] });
      }

      // Get sender info
      const sender = await Account.findById(req.user.id);
      if (!sender) {
        return res.status(404).json({ errors: [{ msg: "User not found" }] });
      }

      // Rate limiting check
      const currentTime = Date.now();
      if (sender.lastMessage && currentTime - sender.lastMessage.getTime() < 3000) {
        return res.status(429).json({ errors: [{ msg: "Please wait 3 seconds between messages" }] });
      }

      // Update last message time
      await Account.findByIdAndUpdate(req.user.id, { lastMessage: currentTime });

      // Create and save message
      const chatMessage = new Message({
        thumbnail: sender.thumbnail,
        username: sender.username,
        robloxId: sender.robloxId,
        timestamp: currentTime,
        message: message,
        rank: sender.rank,
      });

      await chatMessage.save();
      console.log(`Message saved: "${message}" from ${sender.username}`);

      // Clean up old messages (keep only latest 40)
      const messagesCount = await Message.countDocuments();
      if (messagesCount > 40) {
        const messagesToDelete = messagesCount - 40;
        const oldestMessages = await Message.find()
          .sort({ timestamp: 1 })
          .limit(messagesToDelete);

        for (const oldMessage of oldestMessages) {
          await Message.findByIdAndDelete(oldMessage._id);
        }
        console.log(`Cleaned up ${messagesToDelete} old messages`);
      }

      // Send success response
      res.status(200).json({ success: true, message: "Message sent successfully" });

      // Emit real-time update (don't wait for this)
      try {
        const messages = await getMessages();
        const onlineCount = await getOnlineCount();
        emitEvent("CHAT_UPDATE", { messages, onlineCount });
      } catch (emitError) {
        console.error("Error emitting chat update:", emitError);
        // Don't fail the request if emit fails
      }

    } catch (error) {
      console.error("Error in send_message:", error);
      return res.status(500).json({ errors: [{ msg: "Internal server error" }] });
    }
  }),
];

exports.get_chat_info = asyncHandler(async (req, res, next) => {
  try {
    const [messages, onlineCount, giveaways] = await Promise.all([
      getMessages(),
      getOnlineCount(),
      getGiveaways(),
    ]);

    res.status(200).json({
      messages: messages || [],
      onlineCount: onlineCount || 0,
      giveaways: giveaways || { newGiveaways: [], userEntries: [] }
    });
  } catch (error) {
    console.error("Error getting chat info:", error);
    return res.status(500).json({ errors: [{ msg: "Failed to load chat" }] });
  }
});

async function getMessages() {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 }) // Sort by oldest first for proper chat flow
      .limit(40)
      .lean(); // Use lean() for better performance

    return messages || [];
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return [];
  }
}

async function getGiveaways() {
  try {
    const newGiveaways = await Giveaway.find({ inactive: false }, { host: 0 })
      .sort({ createdAt: -1 })
      .populate({
        path: "item",
        populate: {
          path: "item",
          model: Item,
        },
      })
      .lean();

    const userEntries = await GiveawayEntry.find({}, { joiner: 0 }).lean();

    return {
      newGiveaways: newGiveaways || [],
      userEntries: userEntries || []
    };
  } catch (error) {
    console.error("Error retrieving giveaways:", error);
    return { newGiveaways: [], userEntries: [] };
  }
}

// Scheduled cleanup function - deletes messages older than 3 hours
async function cleanupOldMessages() {
  try {
    const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000); // 3 hours in milliseconds

    const result = await Message.deleteMany({
      timestamp: { $lt: threeHoursAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Chat cleanup: Deleted ${result.deletedCount} messages older than 3 hours`);
    }

    return result.deletedCount;
  } catch (error) {
    console.error("Error during chat cleanup:", error);
    return 0;
  }
}

exports.cleanupOldMessages = cleanupOldMessages;
