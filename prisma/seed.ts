/**
 * Seed script — populates the database with:
 *   - Users from the assignment spec (Nick Fury, Captain Marvel, etc.)
 *   - Mock restaurants (India + America)
 *   - Menu items per restaurant
 *   - Payment methods per user
 *
 * Run: npm run seed
 */
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter } as any);

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password@123';

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Clear existing data (order matters for FK constraints) ──────────────
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const pw = await hashPassword(DEFAULT_PASSWORD);

  // ─── Users ────────────────────────────────────────────────────────────────
  const [nickFury, captainMarvel, captainAmerica, thanos, thor, travis] =
    await Promise.all([
      prisma.user.create({
        data: { name: 'Nick Fury', email: 'nick@slooze.com', password: pw, role: 'ADMIN', country: null },
      }),
      prisma.user.create({
        data: { name: 'Captain Marvel', email: 'marvel@slooze.com', password: pw, role: 'MANAGER', country: 'INDIA' },
      }),
      prisma.user.create({
        data: { name: 'Captain America', email: 'america@slooze.com', password: pw, role: 'MANAGER', country: 'AMERICA' },
      }),
      prisma.user.create({
        data: { name: 'Thanos', email: 'thanos@slooze.com', password: pw, role: 'MEMBER', country: 'INDIA' },
      }),
      prisma.user.create({
        data: { name: 'Thor', email: 'thor@slooze.com', password: pw, role: 'MEMBER', country: 'INDIA' },
      }),
      prisma.user.create({
        data: { name: 'Travis', email: 'travis@slooze.com', password: pw, role: 'MEMBER', country: 'AMERICA' },
      }),
    ]);

  console.log('✅ Users created');

  // ─── Restaurants ─────────────────────────────────────────────────────────

  // India restaurants
  const [swadesh, spiceroute, theKhana] = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: 'Swadesh Kitchen',
        cuisine: 'North Indian',
        address: '12 MG Road, Bengaluru, Karnataka',
        country: 'INDIA',
        rating: 4.5,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Spice Route',
        cuisine: 'South Indian',
        address: '88 Anna Salai, Chennai, Tamil Nadu',
        country: 'INDIA',
        rating: 4.3,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'The Khana',
        cuisine: 'Mughlai',
        address: '5 Hazratganj, Lucknow, UP',
        country: 'INDIA',
        rating: 4.6,
      },
    }),
  ]);

  // America restaurants
  const [burgerBros, pizzapalace, tacotruck] = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: "Burger Bros",
        cuisine: 'American',
        address: '100 Broadway, New York, NY',
        country: 'AMERICA',
        rating: 4.2,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Pizza Palace',
        cuisine: 'Italian-American',
        address: '250 Sunset Blvd, Los Angeles, CA',
        country: 'AMERICA',
        rating: 4.4,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Taco Truck Central',
        cuisine: 'Mexican-American',
        address: '50 Mission Street, San Francisco, CA',
        country: 'AMERICA',
        rating: 4.1,
      },
    }),
  ]);

  console.log('✅ Restaurants created');

  // ─── Menu Items ───────────────────────────────────────────────────────────

  await Promise.all([
    // Swadesh Kitchen
    prisma.menuItem.createMany({
      data: [
        { name: 'Butter Chicken', description: 'Creamy tomato-based curry with tender chicken', price: 320, category: 'Main Course', restaurantId: swadesh.id },
        { name: 'Dal Makhani', description: 'Slow-cooked black lentils with butter and cream', price: 220, category: 'Main Course', restaurantId: swadesh.id },
        { name: 'Garlic Naan', description: 'Tandoor-baked bread with garlic topping', price: 60, category: 'Bread', restaurantId: swadesh.id },
        { name: 'Mango Lassi', description: 'Chilled yogurt drink with fresh mango pulp', price: 120, category: 'Beverage', restaurantId: swadesh.id },
        { name: 'Gulab Jamun', description: 'Deep-fried milk-solid dumplings in sugar syrup', price: 100, category: 'Dessert', restaurantId: swadesh.id },
      ],
    }),
    // Spice Route
    prisma.menuItem.createMany({
      data: [
        { name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: 180, category: 'Breakfast', restaurantId: spiceroute.id },
        { name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', price: 140, category: 'Breakfast', restaurantId: spiceroute.id },
        { name: 'Chettinad Chicken Curry', description: 'Aromatic South Indian chicken with whole spices', price: 360, category: 'Main Course', restaurantId: spiceroute.id },
        { name: 'Filter Coffee', description: 'Traditional South Indian filtered coffee', price: 80, category: 'Beverage', restaurantId: spiceroute.id },
        { name: 'Payasam', description: 'Sweet rice pudding with coconut and jaggery', price: 120, category: 'Dessert', restaurantId: spiceroute.id },
      ],
    }),
    // The Khana
    prisma.menuItem.createMany({
      data: [
        { name: 'Biryani (Mutton)', description: 'Slow-cooked mutton with basmati rice and saffron', price: 450, category: 'Main Course', restaurantId: theKhana.id },
        { name: 'Seekh Kebab', description: 'Minced meat kebabs grilled on skewers', price: 280, category: 'Starter', restaurantId: theKhana.id },
        { name: 'Shahi Paneer', description: 'Cottage cheese in rich cashew-cream gravy', price: 300, category: 'Main Course', restaurantId: theKhana.id },
        { name: 'Roomali Roti', description: 'Thin handkerchief-style bread', price: 50, category: 'Bread', restaurantId: theKhana.id },
        { name: 'Shahi Tukda', description: 'Fried bread in sweetened condensed milk', price: 150, category: 'Dessert', restaurantId: theKhana.id },
      ],
    }),
    // Burger Bros
    prisma.menuItem.createMany({
      data: [
        { name: 'Classic Smash Burger', description: 'Double smash patty, American cheese, pickles, onions', price: 14.99, category: 'Burger', restaurantId: burgerBros.id },
        { name: 'Crispy Chicken Sandwich', description: 'Fried chicken breast with coleslaw and chipotle mayo', price: 12.99, category: 'Sandwich', restaurantId: burgerBros.id },
        { name: 'Loaded Fries', description: 'Seasoned fries topped with cheese sauce and bacon', price: 8.99, category: 'Sides', restaurantId: burgerBros.id },
        { name: 'Chocolate Milkshake', description: 'Thick premium chocolate shake', price: 6.99, category: 'Beverage', restaurantId: burgerBros.id },
        { name: 'Apple Pie Slice', description: 'Warm cinnamon apple pie with vanilla cream', price: 5.99, category: 'Dessert', restaurantId: burgerBros.id },
      ],
    }),
    // Pizza Palace
    prisma.menuItem.createMany({
      data: [
        { name: 'Margherita Pizza (12")', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 18.99, category: 'Pizza', restaurantId: pizzapalace.id },
        { name: 'Pepperoni Pizza (12")', description: 'House-made tomato sauce with turkey pepperoni', price: 21.99, category: 'Pizza', restaurantId: pizzapalace.id },
        { name: 'Caesar Salad', description: 'Romaine, parmesan, house croutons, Caesar dressing', price: 10.99, category: 'Salad', restaurantId: pizzapalace.id },
        { name: 'Garlic Knots (6pcs)', description: 'Soft dough knots baked with garlic butter', price: 7.99, category: 'Sides', restaurantId: pizzapalace.id },
        { name: 'Tiramisu', description: 'Classic Italian espresso dessert', price: 8.99, category: 'Dessert', restaurantId: pizzapalace.id },
      ],
    }),
    // Taco Truck Central
    prisma.menuItem.createMany({
      data: [
        { name: 'Carne Asada Tacos (3pcs)', description: 'Grilled beef with cilantro, onion, salsa verde', price: 13.99, category: 'Tacos', restaurantId: tacotruck.id },
        { name: 'Veggie Burrito', description: 'Black beans, rice, peppers, guac in a flour tortilla', price: 11.99, category: 'Burrito', restaurantId: tacotruck.id },
        { name: 'Loaded Nachos', description: 'Tortilla chips, cheese, jalapeños, sour cream', price: 9.99, category: 'Sides', restaurantId: tacotruck.id },
        { name: 'Horchata', description: 'Chilled cinnamon rice milk drink', price: 4.99, category: 'Beverage', restaurantId: tacotruck.id },
        { name: 'Churros (4pcs)', description: 'Fried dough sticks with cinnamon sugar and dipping sauce', price: 6.99, category: 'Dessert', restaurantId: tacotruck.id },
      ],
    }),
  ]);

  console.log('✅ Menu items created');

  // ─── Payment Methods ──────────────────────────────────────────────────────

  await Promise.all([
    prisma.paymentMethod.create({
      data: { userId: nickFury.id, type: 'CREDIT_CARD', provider: 'Visa', last4: '1234', isDefault: true },
    }),
    prisma.paymentMethod.create({
      data: { userId: captainMarvel.id, type: 'DEBIT_CARD', provider: 'HDFC', last4: '5678', isDefault: true },
    }),
    prisma.paymentMethod.create({
      data: { userId: captainMarvel.id, type: 'UPI', provider: 'PhonePe', isDefault: false },
    }),
    prisma.paymentMethod.create({
      data: { userId: captainAmerica.id, type: 'CREDIT_CARD', provider: 'Mastercard', last4: '9012', isDefault: true },
    }),
    prisma.paymentMethod.create({
      data: { userId: thanos.id, type: 'UPI', provider: 'GPay', isDefault: true },
    }),
    prisma.paymentMethod.create({
      data: { userId: thor.id, type: 'NET_BANKING', provider: 'SBI', isDefault: true },
    }),
    prisma.paymentMethod.create({
      data: { userId: travis.id, type: 'DEBIT_CARD', provider: 'Chase', last4: '3456', isDefault: true },
    }),
  ]);

  console.log('✅ Payment methods created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials (all users share the same password):');
  console.log('   Password: Password@123\n');
  console.log('   Nick Fury (Admin):      nick@slooze.com');
  console.log('   Captain Marvel (Mgr-IN): marvel@slooze.com');
  console.log('   Captain America (Mgr-US): america@slooze.com');
  console.log('   Thanos (Member-IN):     thanos@slooze.com');
  console.log('   Thor (Member-IN):       thor@slooze.com');
  console.log('   Travis (Member-US):     travis@slooze.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
