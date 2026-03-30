const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
const mongoose = require('mongoose');
const User     = require('./models/User');
const MenuItem = require('./models/MenuItem');

const MENU_ITEMS = [
  { name: 'Smash Burger',      price: 13.99, category: 'burger',  available: true,  description: 'Double smash patty, American cheese, pickles, smash sauce.' },
  { name: 'BBQ Bacon Burger',  price: 15.99, category: 'burger',  available: true,  description: 'Crispy bacon, cheddar, smoky BBQ sauce, caramelised onions.' },
  { name: 'Mushroom Swiss',    price: 14.49, category: 'burger',  available: true,  description: 'Sautéed mushrooms, Swiss cheese, garlic aioli, brioche bun.' },
  { name: 'Margherita Pizza',  price: 16.99, category: 'pizza',   available: true,  description: 'San Marzano tomato, fresh mozzarella, basil, olive oil.' },
  { name: 'Pepperoni Blast',   price: 18.99, category: 'pizza',   available: true,  description: 'Double pepperoni, mozzarella, spicy tomato base.' },
  { name: 'BBQ Chicken Pizza', price: 19.49, category: 'pizza',   available: true,  description: 'Pulled chicken, red onion, BBQ drizzle, mozzarella.' },
  { name: 'Loaded Fries',      price:  7.99, category: 'sides',   available: true,  description: 'Crispy fries, cheddar sauce, jalapeños, sour cream.' },
  { name: 'Onion Rings',       price:  6.49, category: 'sides',   available: true,  description: 'Beer-battered, served with chipotle dip.' },
  { name: 'Coleslaw',          price:  3.99, category: 'sides',   available: true,  description: 'House-made creamy coleslaw, fresh herbs.' },
  { name: 'Classic Cola',      price:  2.99, category: 'drink',   available: true,  description: 'Ice cold Coca-Cola, free refills.' },
  { name: 'Craft Lemonade',    price:  4.49, category: 'drink',   available: true,  description: 'Fresh-squeezed, mint, sparkling water.' },
  { name: 'Chocolate Shake',   price:  6.99, category: 'drink',   available: true,  description: 'Thick hand-spun chocolate milkshake.' },
  { name: 'Churro Bites',      price:  5.99, category: 'dessert', available: true,  description: 'Cinnamon sugar churros, chocolate dipping sauce.' },
  { name: 'NY Cheesecake',     price:  6.49, category: 'dessert', available: true,  description: 'Classic New York style, strawberry compote.' },
];

const USERS = [
  { username: 'admin',   password: 'admin123',  role: 'admin'  },
  { username: 'member1', password: 'member123', role: 'member' },
  { username: 'guest1',  password: 'guest123',  role: 'guest'  },
];

async function seed() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('MONGO_URI:', uri ? '✓ found' : '❌ missing');
    if (!uri) throw new Error('MONGO_URI is not set in server/.env');

    await mongoose.connect(uri);
    console.log('Connected to Atlas\n');

    await MenuItem.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    await MenuItem.insertMany(MENU_ITEMS);
    console.log(`Seeded ${MENU_ITEMS.length} menu items`);

    for (const u of USERS) {
      await User.create(u);
      console.log(`Created user: ${u.username} (${u.role})`);
    }

    console.log('\nSeed complete! Login credentials:');
    console.log('  Admin  → username: admin   password: admin123');
    console.log('  Member → username: member1 password: member123');
    console.log('  Guest  → username: guest1  password: guest123');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();