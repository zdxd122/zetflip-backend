const mongoose = require('mongoose');
const Item = require('./models/item');
const InventoryItem = require('./models/inventoryItem');
const Account = require('./models/account');
const dotenv = require('dotenv');
dotenv.config();

async function addTestItems() {
  try {
    // Connect to MongoDB (using the same connection as the app)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloxpvp_casino';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Use the currently logged-in user ID from the logs
    const currentUserId = '68b1b739b472ea75bc641344';
    let targetUser = await Account.findById(currentUserId);

    if (!targetUser) {
      console.log('❌ Current user not found with ID:', currentUserId);
      console.log('Creating user account for current user ID...');

      // Create a basic user account for the current user ID
      targetUser = new Account({
        _id: currentUserId,
        username: 'CoolBoy_Zuk4',
        displayName: 'Cool Boy Zuk4',
        robloxId: null, // No Roblox ID for this account
        balance: 1000,
        level: 1,
        deposited: 0,
        withdrawn: 0,
        wagered: 0,
        BTCAddress: "",
        ETHAddress: "",
        LTCAddress: "",
        BNBAddress: "",
        USDTAddress: "",
        diceClientSeed: 'default-seed',
        limboClientSeed: 'default-seed',
        minesClientSeed: 'default-seed',
        blackjackClientSeed: 'default-seed',
        diceServerSeed: 'default-seed',
        limboServerSeed: 'default-seed',
        minesServerSeed: 'default-seed',
        blackjackServerSeed: 'default-seed',
        diceHistory: [],
        limboHistory: [],
        minesHistory: [],
        blackjackHistory: [],
        ips: [],
        joinDate: new Date(),
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

      await targetUser.save();
      console.log('✅ Created user account for current user ID');
    }

    console.log('✅ Target user found:', targetUser.username, 'ID:', targetUser._id);
    console.log('Adding test items for user:', targetUser.username);

    // Create some test items
    const testItems = [
      {
        item_id: 1,
        item_name: 'test_pet_1',
        display_name: 'Test Cat',
        item_value: '100',
        item_image: 'https://www.roblox.com/asset-thumbnail/image?assetId=1&width=420&height=420&format=png',
        game: 'AMP'
      },
      {
        item_id: 2,
        item_name: 'test_pet_2',
        display_name: 'Test Dog',
        item_value: '200',
        item_image: 'https://www.roblox.com/asset-thumbnail/image?assetId=2&width=420&height=420&format=png',
        game: 'AMP'
      },
      {
        item_id: 3,
        item_name: 'test_pet_3',
        display_name: 'Test Bunny',
        item_value: '150',
        item_image: 'https://www.roblox.com/asset-thumbnail/image?assetId=3&width=420&height=420&format=png',
        game: 'AMP'
      }
    ];

    // Add items to database (ignore if they already exist)
    const savedItems = [];
    for (const itemData of testItems) {
      let item = await Item.findOne({ item_name: itemData.item_name });
      if (!item) {
        item = new Item(itemData);
        await item.save();
        console.log('Created item:', item.display_name);
      }
      savedItems.push(item);
    }

    // Add items to user's inventory
    for (const item of savedItems) {
      const existingInventoryItem = await InventoryItem.findOne({
        item: item._id,
        owner: targetUser._id
      });

      if (!existingInventoryItem) {
        const inventoryItem = new InventoryItem({
          item: item._id,
          owner: targetUser._id,
          locked: false,
          game: 'AMP'
        });
        await inventoryItem.save();
        console.log('Added to inventory:', item.display_name);
      } else {
        console.log('Already in inventory:', item.display_name);
      }
    }

    console.log('✅ Test items added successfully!');
    console.log('User can now test coinflip with items worth: 100, 200, 150 (total: 450)');

  } catch (error) {
    console.error('Error adding test items:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTestItems();