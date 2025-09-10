const mongoose = require('mongoose');
const InventoryItem = require('./models/inventoryItem');
const Item = require('./models/item');
const Account = require('./models/account');

async function checkInventory() {
  try {
    // Connect to MongoDB (using the same connection as the app)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloxpvp';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check all inventory items
    const allItems = await InventoryItem.find({}).populate('item').populate('owner');
    console.log('All inventory items in database:');
    allItems.forEach(item => {
      console.log(`- ID: ${item._id}, Owner: ${item.owner?.username || item.owner}, Item: ${item.item?.display_name || item.item}, Locked: ${item.locked}`);
    });

    // Check specific user
    const userId = '68b1b44d022e371e7beae476';
    const userItems = await InventoryItem.find({ owner: userId, locked: false }).populate('item');
    console.log(`\nItems for user ${userId}:`);
    userItems.forEach(item => {
      console.log(`- ${item.item?.display_name} (value: ${item.item?.item_value})`);
    });

    // Check user account
    const user = await Account.findById(userId);
    console.log(`\nUser account: ${user?.username}, ID: ${user?._id}`);

    // Check if there's a CoolBoy_Zuk4 account
    const coolBoyAccount = await Account.findOne({ username: 'CoolBoy_Zuk4' });
    if (coolBoyAccount) {
      console.log(`\nFound CoolBoy_Zuk4 account: ${coolBoyAccount.username}, ID: ${coolBoyAccount._id}`);

      // Update the user account to have CoolBoy_Zuk4 username
      await Account.updateOne({ _id: userId }, { username: 'CoolBoy_Zuk4' });
      console.log(`\nUpdated user account username to CoolBoy_Zuk4`);

      // Verify the update
      const updatedUser = await Account.findById(userId);
      console.log(`\nUpdated user account: ${updatedUser?.username}, ID: ${updatedUser?._id}`);

      // Check items for this user
      const userItems = await InventoryItem.find({ owner: userId, locked: false }).populate('item');
      console.log(`\nItems for user ${userId} (${updatedUser?.username}):`);
      userItems.forEach(item => {
        console.log(`- ${item.item?.display_name} (value: ${item.item?.item_value})`);
      });
    } else {
      console.log(`\nNo CoolBoy_Zuk4 account found. Current user is: ${user?.username}`);
    }

  } catch (error) {
    console.error('Error checking inventory:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
checkInventory();