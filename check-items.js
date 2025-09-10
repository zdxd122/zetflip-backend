const mongoose = require('mongoose');
const Item = require('./models/item');
const InventoryItem = require('./models/inventoryItem');
const Account = require('./models/account');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloxpvp';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check items in database
    const items = await Item.find({});
    console.log(`\n📦 Items in database: ${items.length}`);
    items.forEach(item => {
      console.log(`- ${item.display_name} (${item.item_name}): ${item.item_value} value`);
    });

    // Check user's inventory
    const userId = '68b1b44d022e371e7beae476';
    const inventoryItems = await InventoryItem.find({ owner: userId }).populate('item');
    console.log(`\n🎒 User inventory items: ${inventoryItems.length}`);
    inventoryItems.forEach(invItem => {
      console.log(`- ${invItem.item.display_name} (${invItem.item.item_name}): ${invItem.item.item_value} value, locked: ${invItem.locked}`);
    });

    // Check user account
    const user = await Account.findById(userId);
    console.log(`\n👤 User: ${user.username} (${user._id})`);

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkDatabase();