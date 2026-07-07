const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Sample users data
const users = [
  {
    fullname: 'John Doe',
    email: 'john.doe@example.com',
    mobilenumber: '1234567890',
    password: 'password123',
    role: 'admin'
  },
  {
    fullname: 'Jane Smith',
    email: 'jane.smith@example.com',
    mobilenumber: '9876543210',
    password: 'password123',
    role: 'user'
  },
  {
    fullname: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    mobilenumber: '5555555555',
    password: 'password123',
    role: 'moderator'
  },
  {
    fullname: 'Alice Brown',
    email: 'alice.brown@example.com',
    mobilenumber: '1112223333',
    password: 'password123',
    role: 'user'
  },
  {
    fullname: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    mobilenumber: '4445556666',
    password: 'password123',
    role: 'user'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI123);
    console.log('Connected123 to MongoDB for seeding...', process.env.MONGODB_URI123);

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Insert new users
    const createdUsers = await User.create(users);
    console.log(`Successfully seeded ${createdUsers.length} users`);

    // Display seeded users (without passwords)
    console.log('\nSeeded users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.fullname} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
      console.log('Connected to MongoDB for seeding...', process.env.MONGODB_URI123);
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();