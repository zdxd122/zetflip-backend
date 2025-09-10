const asyncHandler = require("express-async-handler");
const { validationResult, body } = require("express-validator");
const Account = require("../../models/account");
const noblox = require("noblox.js");
const InventoryItem = require("../../models/inventoryItem");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const crypto = require("crypto");
const randomWords = require("random-words");
const mongoose = require("mongoose");
const { JWT_SECRET } = require("../../config");
let userStore = {}
dotenv.config();

exports.authenticateToken = asyncHandler(async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.user = user;
    next();
  });
});

exports.auto_login = asyncHandler(async (req, res) => {
  try {
    const userData = await Account.findOne(
      { _id: req.user.id },
      { ips: 0, _id: 0, __v: 0, password: 0, withdrawalWalletAddresses: 0 }
    );
    res.status(200).send(userData);
  } catch (error) {
    console.error("Error retrieving user data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

exports.load_inventory = asyncHandler(async (req, res) => {
  try {
    console.log("🔍 Loading inventory for user ID:", req.user.id);
    console.log("🔍 User ID type:", typeof req.user.id);

    // Try to find items using string ID first
    let userItems = await InventoryItem.find({
      owner: req.user.id,
      locked: false,
    })
      .populate("item")
      .sort({ "item.item_value": -1 })
      .exec();

    console.log("🔍 Found inventory items with string ID:", userItems.length);

    // If no items found with string ID, try ObjectId
    if (userItems.length === 0) {
      try {
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        console.log("🔍 Trying with ObjectId:", userObjectId);
        userItems = await InventoryItem.find({
          owner: userObjectId,
          locked: false,
        })
          .populate("item")
          .sort({ "item.item_value": -1 })
          .exec();
        console.log("🔍 Found inventory items with ObjectId:", userItems.length);
      } catch (objectIdError) {
        console.log("🔍 ObjectId conversion failed:", objectIdError.message);
      }
    }

    console.log("🔍 Final inventory items:", userItems.length);
    console.log("🔍 Inventory items details:", userItems.map(item => ({
      id: item._id,
      itemName: item.item?.item_name,
      itemValue: item.item?.item_value,
      locked: item.locked,
      owner: item.owner
    })));

    const totalValue = userItems.reduce(
      (acc, userItem) => acc + Number(userItem.item?.item_value || 0),
      0
    );

    const inventoryInfo = {
      totalValue,
      userItems,
    };

    console.log("🔍 Sending inventory response:", {
      totalValue,
      itemCount: userItems.length
    });

    res.send(inventoryInfo);
  } catch (error) {
    console.error("Error loading inventory items:", error);
    res.status(500).send("Internal Server Error");
  }
});

exports.connect_roblox = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Your username must be between 3 and 20 characters")
    .escape(),
  body("referrer").trim().escape(),
  asyncHandler(async (req, res) => {
    try {
      console.log("🔍 Login attempt - Step:", req.body.username ? "1" : "2");
      console.log("🔍 Request body:", req.body);

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res.status(400).send(errors.array());
      }

      let userId;
      try {
        userId = await noblox.getIdFromUsername(req.body.username);
      } catch (error) {
        console.error("Error getting Roblox user ID:", error);
        return res.status(500).send("Failed to connect to Roblox API");
      }

      if (!userId) {
        return res.status(404).send("Invalid Roblox username");
      }

      const accountData = await Account.findOne({ robloxId: userId });

      let randomDescription;

      if (accountData != null) {
        if (userStore[userId]?.descriptionSet === true) {
          delete userStore[userId];

          try {
            const userData = await noblox.getPlayerInfo(userId);
            const userThumbnail = await noblox.getPlayerThumbnail(
              userId,
              420,
              "png",
              false,
              "Headshot"
            );

            if (userData.blurb == accountData.description) {
              console.log("Phrase and description are the same :D ");

              randomDescription = generateRandomDescription();

              await Account.updateOne({ robloxId: userId }, { description: randomDescription });

              await Account.updateOne(
                { robloxId: userId },
                {
                  $push: {
                    ips: {
                      ip: req.ip,
                    },
                  },
                  thumbnail: userThumbnail[0].imageUrl,
                }
              );

              const token = jwt.sign({ id: accountData._id }, JWT_SECRET);
              console.log('JWT token generated successfully');

              return res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                  id: accountData._id,
                  username: accountData.username,
                  robloxId: accountData.robloxId
                }
              });
            } else if (userData.blurb != accountData.description) {
              delete userStore[userId];
              return res.status(400).send("Description does not match");
            }
          } catch (error) {
            console.error("Error with Roblox API:", error);
            return res.status(500).send("Failed to get Roblox user data");
          }
        } else {
          randomDescription = generateRandomDescription();

          await Account.updateOne({ robloxId: userId }, { description: randomDescription });

          userStore[userId] = { descriptionSet: true };

          return res.status(200).send(randomDescription);
        }
      } else {
        if (userId == null) {
          console.log(`id: ${userId}, nameEntered: ${req.body.username}`);
          return res.status(404).send("Invalid Username");
        }

        delete userStore[userId];

        try {
          const userData = await noblox.getPlayerInfo(userId);
          const userThumbnail = await noblox.getPlayerThumbnail(
            userId,
            420,
            "png",
            false,
            "Headshot"
          );
          randomDescription = generateRandomDescription();

          const checkReferrer = await Account.findOne({ robloxId: req.body.referrer });
          const validReferrer = checkReferrer != null ? checkReferrer.username : null;

          if (validReferrer != null) {
            await Account.updateOne(
              { username: validReferrer },
              {
                description: randomDescription,
                affiliate: {
                  $push: {
                    referrals: {
                      robloxId: userId,
                      wagered: 0,
                    },
                  },
                },
              }
            );
          }

          const account = new Account({
            robloxId: userId,
            username: userData.username,
            displayName: userData.displayName,
            description: randomDescription,
            thumbnail: userThumbnail[0].imageUrl,
            rank: "User",
            level: 1,
            deposited: 0,
            withdrawn: 0,
            wagered: 0,
            BTCAddress: "",
            ETHAddress: "",
            LTCAddress: "",
            BNBAddress: "",
            USDTAddress: "",
            diceClientSeed: generateClientSeed(),
            limboClientSeed: generateClientSeed(),
            minesClientSeed: generateClientSeed(),
            blackjackClientSeed: generateClientSeed(),
            diceServerSeed: generateServerSeed(),
            limboServerSeed: generateServerSeed(),
            minesServerSeed: generateServerSeed(),
            blackjackServerSeed: generateServerSeed(),
            diceHistory: [],
            limboHistory: [],
            minesHistory: [],
            blackjackHistory: [],
            balance: 0,
            withdrawalWalletAddresses: [],
            ips: [],
            joinDate: new Date(),
            referrer: validReferrer,
            lastMessage: new Date(),
            totalBets: 0,
            gamesWon: 0,
            affiliate: {
              wagered: 0,
              totalEarnings: 0,
              balance: 0,
              referrals: [],
            },
          });

          await account.save();
          console.log("Account saved successfully");
          res.status(200).send(randomDescription);
        } catch (error) {
          console.error("Error creating account:", error);
          res.status(500).send("Error creating account");
        }
      }
    } catch (error) {
      console.error("Unexpected error in connect_roblox:", error);
      return res.status(500).send("Internal server error");
    }
  }),
];

exports.roblox_auth_check = asyncHandler(async (req, res, next) => {
  const account = await Account.findOne({ _id: req.user.id });
  if (!account.robloxId) {
    return res.status(401).send("You have not connected your Roblox account");
  }
  next();
});

exports.get_profile = [
  body("userId").trim().escape(),
  asyncHandler(async (req, res) => {
    const userData = await Account.findOne({ robloxId: req.body.userId });

    if (!userData) {
      return res.status(404).send("User was not found");
    }

    const nextLevel = Math.ceil(userData.level);
    const nextLevelXP = Math.pow(nextLevel / 0.04, 2);

    const toReturn = {
      totalBets: userData.totalBets,
      gamesWon: userData.gamesWon,
      wagered: userData.wagered,
      profit: userData.withdrawn - userData.deposited,
      username: userData.username,
      xp: userData.wagered,
      xpMax: nextLevelXP,
      level: userData.level,
      thumbnail: userData.thumbnail,
      joinDate: userData.joinDate,
    };

    res.status(200).send(toReturn);
  }),
];

exports.get_profile_by_id = asyncHandler(async (req, res) => {
  const userData = await Account.findOne({ robloxId: req.params.userId });

  if (!userData) {
    return res.status(404).send("User was not found");
  }

  const nextLevel = Math.ceil(userData.level);
  const nextLevelXP = Math.pow(nextLevel / 0.04, 2);

  const toReturn = {
    totalBets: userData.totalBets,
    gamesWon: userData.gamesWon,
    wagered: userData.wagered,
    profit: userData.withdrawn - userData.deposited,
    username: userData.username,
    xp: userData.wagered,
    xpMax: nextLevelXP,
    level: userData.level,
    thumbnail: userData.thumbnail,
    joinDate: userData.joinDate,
  };

  res.status(200).send(toReturn);
});

function generateServerSeed() {
  return crypto.randomBytes(20).toString("hex");
}

function generateClientSeed() {
  return crypto.randomBytes(20).toString("hex");
}

function generateRandomDescription() {
  const phrase = ["AdoptFlip", "|"];

  // Generate exactly 10 random words
  for (let i = 0; i < 10; i++) {
    const randomWord = randomWords();
    phrase.push(randomWord);
  }

  return phrase.join(" ");
}
