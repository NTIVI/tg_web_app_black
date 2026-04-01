import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegram_id: { type: String, unique: true, required: true },
  username: String,
  first_name: String,
  last_name: String,
  photo_url: String,
  balance: { type: Number, default: 0 },
  phone: String,
  email: String,
  registered_at: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now }
});

const purchaseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  item_name: String,
  price: Number,
  purchased_at: { type: Date, default: Date.now }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String
});

export const User = mongoose.model('User', userSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const Setting = mongoose.model('Setting', settingSchema);
