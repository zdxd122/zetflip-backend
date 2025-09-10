const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account/accountController");
const chatController = require("../controllers/chat/chatController");
const coinflipController = require("../controllers/coinflip/coinflipController");
const jackpotController = require("../controllers/jackpot/jackpotController");
const giveawayController = require("../controllers/giveaways/giveawayController");
const cashierController = require("../controllers/cashier/cashierController");
const botController = require("../controllers/bot/botController");
const oxaPayDepositController = require("../controllers/payments/oxaPayDepositController");
const { createStaticAddress } = require("../controllers/payments/oxaPayDepositController");
const { sendPayout, getBalance } = require("../controllers/payments/oxaPayWithdrawController");
const expressQueue = require("express-queue");
const queueMw = expressQueue({ activeLimit: 1, queuedLimit: -1 });
const roblox_auth_check = accountController.roblox_auth_check;
const minesController = require('../controllers/games/minesController');


//Mines
//wss://323e38b2-4f53-42ed-a232-ad2bc264e8c2-00-3c2u3risany1k.picard.replit.dev/socket.io/?EIO=4&transport=websocket
// { "event": "minesClick", "row": 1, "tile": 2 }

router.post("/mines/create-game", accountController.authenticateToken, minesController.handleMinesCreateGame);




// ACCOUNT ROUTES
//router.post("/register", queueMw, accountController.register);
//router.post("/login", accountController.login);
router.post("/connect-roblox", accountController.connect_roblox);
router.get("/login-auto", accountController.authenticateToken, accountController.auto_login);
router.get("/user/inventory", accountController.authenticateToken, accountController.load_inventory);
router.post("/profile", accountController.get_profile);
router.get("/profile/:userId", accountController.get_profile_by_id);

// CHAT ROUTES
router.post("/message", accountController.authenticateToken, roblox_auth_check, chatController.send_message);
router.get("/chat", chatController.get_chat_info);

// COINFLIP ROUTES
router.post("/coinflip/create", accountController.authenticateToken, coinflipController.create_coinflip);
router.post("/coinflip/join", accountController.authenticateToken, coinflipController.join_coinflip);
router.get("/coinflips", coinflipController.get_coinflips);

// JACKPOT ROUTES
router.post("/jackpot/join", accountController.authenticateToken, jackpotController.join_jackpot);
router.get("/jackpot", jackpotController.get_jackpot);

// GIVEAWAY ROUTES
router.post("/giveaway/create", accountController.authenticateToken, roblox_auth_check, giveawayController.create_giveaway);
router.post("/giveaway/join", accountController.authenticateToken, roblox_auth_check, giveawayController.join_giveaway);
router.get("/giveaways", giveawayController.get_giveaways);

// MM2 ROUTES
router.get("/cashier/bots/mm2", botController.get_bots_mm2);
router.post("/deposit/mm2", cashierController.deposit_mm2);
router.post("/withdrawals/mm2", cashierController.get_withdraw_mm2);
router.post("/withdraw/mm2/clear", cashierController.clear_withdraw_mm2);

// PS99 ROUTES
router.post("/deposit/ps99", cashierController.deposit_ps99);
router.post("/withdrawals/ps99", cashierController.get_withdraw_ps99);
router.post("/withdraw/mm2/clear", cashierController.clear_withdraw_ps99);
router.get("/cashier/bots/ps99", botController.get_bots_ps99);

// AMP ROUTES
router.get("/cashier/bots/amp", botController.get_bots_amp);

// CASHIER ROUTES
router.post("/withdraw", accountController.authenticateToken, roblox_auth_check, cashierController.create_withdraw);
router.post("/create-static-address", accountController.authenticateToken, roblox_auth_check, createStaticAddress);
router.post("/send-payout", queueMw, accountController.authenticateToken, roblox_auth_check, sendPayout);
router.post("/get-balance", accountController.authenticateToken, roblox_auth_check, getBalance);
router.post("/get-address", accountController.authenticateToken, roblox_auth_check, cashierController.get_address);
router.post("/callback", oxaPayDepositController.callback);


// HEALTH CHECK
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// MISC ROUTES
router.use("*", function (req, res) {
  return res.json({
    success: true,
    message: `Non-Existent Route: [${req.method}] ${req.baseUrl}`,
  });
});

module.exports = router;
