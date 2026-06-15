/**
 * seed.js
 * Run this script to populate the database with users test2, test3, and test4,
 * and create posts, polls, and promotions for them.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');

const usersToSeed = [
  {
    username: 'test2',
    email: 'test2@gmail.com',
    password: 'test2@123',
    bio: 'Passionate Software Developer | Tech Blogger | Material UI enthusiast.',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=test2',
  },
  {
    username: 'test3',
    email: 'test3@gmail.com',
    password: 'test3@123',
    bio: 'Quiz master & competitive gamer. Let\'s connect and build communities.',
    avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=test3',
  },
  {
    username: 'test4',
    email: 'test4@gmail.com',
    password: 'test4@123',
    bio: 'Web3 advocate and crypto strategist. Exploring decentralized finance ecosystems.',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=test4',
  }
];

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Clean up existing test users and their posts
    const usernames = usersToSeed.map(u => u.username);
    console.log('Cleaning up existing data for:', usernames);
    
    // Find matching users first to get their IDs
    const existingUsers = await User.find({ username: { $in: usernames } });
    const userIds = existingUsers.map(u => u._id);
    
    await User.deleteMany({ username: { $in: usernames } });
    await Post.deleteMany({ $or: [{ authorUsername: { $in: usernames } }, { author: { $in: userIds } }] });
    console.log('Cleanup completed.');

    // 2. Create users (this triggers the Mongoose pre-save hook for password hashing)
    console.log('Creating users...');
    const createdUsers = [];
    for (const u of usersToSeed) {
      const newUser = await User.create(u);
      createdUsers.push(newUser);
      console.log(`Created user: @${newUser.username}`);
    }

    const [u2, u3, u4] = createdUsers;

    // 3. Define posts to seed
    const postsToSeed = [
      // test2 posts (Developer theme)
      {
        author: u2._id,
        authorUsername: u2.username,
        text: 'Just finished migrating my portfolio project to React 19 and Material UI. The performance is incredibly smooth! Let me know if you want the Github repo link.',
      },
      {
        author: u2._id,
        authorUsername: u2.username,
        text: 'Which UI framework is your absolute go-to for React projects?',
        poll: {
          options: [
            { text: 'Material UI (MUI)', votes: [] },
            { text: 'Tailwind CSS', votes: [] },
            { text: 'Styled Components', votes: [] },
            { text: 'Vanilla CSS / Modules', votes: [] }
          ],
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 3 days
        }
      },
      {
        author: u2._id,
        authorUsername: u2.username,
        promotion: {
          appName: 'CodeCraft Dev',
          title: 'Speed Up React Development',
          description: 'Automate boilerplate setup, component generation, and styling configurations instantly. Designed for MUI developers.',
          buttonText: 'Try Builder Free',
          buttonLink: 'https://github.com',
          category: 'Refer And Earn',
          themeColor: '#2196F3' // Blue
        }
      },

      // test3 posts (Quiz & Gaming theme)
      {
        author: u3._id,
        authorUsername: u3.username,
        text: 'Took home 1st place in the trivia championship tonight! The final round questions about space exploration were tough.',
      },
      {
        author: u3._id,
        authorUsername: u3.username,
        text: 'What category of trivia matches do you perform best in?',
        poll: {
          options: [
            { text: 'Pop Culture & Movies', votes: [] },
            { text: 'History & World Events', votes: [] },
            { text: 'Science & Nature', votes: [] },
            { text: 'Sports & Games', votes: [] }
          ],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        }
      },
      {
        author: u3._id,
        authorUsername: u3.username,
        promotion: {
          appName: 'QuizArena Gold',
          title: 'Play Trivia, Win Real Gold Vouchers!',
          description: 'Join daily live tournaments. Answer quickly, climb the leaderboard, and cash out physical gold rewards directly to your account.',
          buttonText: 'Join Tournament',
          buttonLink: 'https://bing.com',
          category: 'Refer And Earn',
          themeColor: '#d4af37' // Gold
        }
      },

      // test4 posts (Crypto & Finance theme)
      {
        author: u4._id,
        authorUsername: u4.username,
        text: 'Decentralized identity is going to be the biggest blockchain trend in 2026. Managing your own data credentials is pure freedom.',
      },
      {
        author: u4._id,
        authorUsername: u4.username,
        text: 'Which Layer-1 blockchain network do you run most of your smart contracts on?',
        poll: {
          options: [
            { text: 'Ethereum (L1)', votes: [] },
            { text: 'Solana', votes: [] },
            { text: 'Avalanche', votes: [] },
            { text: 'Cardano', votes: [] }
          ],
          expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000) // 7 days
        }
      },
      {
        author: u4._id,
        authorUsername: u4.username,
        promotion: {
          appName: 'SolWallet DeFi',
          title: 'Secure Swap Sol Wallet',
          description: 'Staking, swapping, and storing token assets made fast. Claim zero transaction fees on your first 15 swaps today!',
          buttonText: 'Claim Free Swaps',
          buttonLink: 'https://google.com',
          category: 'Crypto',
          themeColor: '#4CAF50' // Green
        }
      }
    ];

    console.log('Inserting posts...');
    const inserted = await Post.insertMany(postsToSeed);
    console.log(`Successfully seeded ${inserted.length} posts, polls, and promotions.`);

    // 4. Make them follow each other to verify follow stats!
    console.log('Setting up mock followers...');
    // u2 follows u3 and u4
    u2.following.push(u3._id, u4._id);
    u3.followers.push(u2._id);
    u4.followers.push(u2._id);

    // u3 follows u2
    u3.following.push(u2._id);
    u2.followers.push(u3._id);

    // Save updated follower relationships
    await u2.save();
    await u3.save();
    await u4.save();
    console.log('Mock followers configured.');

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
