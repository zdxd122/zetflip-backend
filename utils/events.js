const { getIO } = require("./socket.js");
const Account = require("../models/account.js");

function emitEvent(eventName, data) {
  const io = getIO();
  console.log(`Emitting event: ${eventName}`, data ? `with ${Array.isArray(data.messages) ? data.messages.length : 'no'} messages` : '');
  io.emit(eventName, data);
}

async function emitBalanceUpdate(userIds) {
  const io = getIO();
  for (let userId of userIds) {
    const balance = await getBalance(userId);
    const accountId = userId.toString();
    io.to(accountId).emit("BALANCE_UPDATE", balance);
  }
}

async function getBalance(user) {
  const userAccount = await Account.findById(user);
  return userAccount.balance;
}

function getOnlineCount() {
  // Import the authenticated users set from socket.js
  const { getAuthenticatedUsersCount } = require("./socket.js");
  return getAuthenticatedUsersCount();
}



module.exports = {
  emitEvent,
  getOnlineCount,
  emitBalanceUpdate,
};
