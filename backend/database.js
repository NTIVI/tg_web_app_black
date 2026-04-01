import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Setting } from './models.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('CRITICAL: MONGODB_URI is not defined in .env file!');
}

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected successfully');
    await initSettings();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit process with failure
    // process.exit(1); 
  }
};

const initSettings = async () => {
    const defaultSettings = [
        { key: 'ads_enabled', value: 'true' },
        { key: 'ads_client_id', value: 'ca-pub-5854666775312114' },
        { key: 'ads_slot_id', value: '9448831633' },
        { key: 'adsgram_block_id', value: '3830' },
        { key: 'rewarded_ad_provider', value: 'adsgram' }
    ];

    for (const s of defaultSettings) {
        await Setting.findOneAndUpdate(
            { key: s.key },
            { $setOnInsert: s },
            { upsert: true, new: true }
        );
    }
};

connectDB();

export default mongoose.connection;
