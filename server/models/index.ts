import mongoose from 'mongoose';
import { User, InsertUser, Poll, InsertPoll, Vote, InsertVote } from '@shared/schema';
import { PollResult, PollStats, DashboardStats } from '@shared/types';

// Connect to MongoDB
export async function connectToDatabase() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

// Poll Schema
const pollSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  options: { type: [String], required: true },
  createdBy: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  isAnonymized: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Vote Schema
const voteSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  pollId: { type: Number, required: true },
  optionIndex: { type: Number, required: true },
  userId: { type: Number, required: true },
  encryptedData: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Counter Schema for auto-incrementing IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

// Models
export const UserModel = mongoose.model('User', userSchema);
export const PollModel = mongoose.model('Poll', pollSchema);
export const VoteModel = mongoose.model('Vote', voteSchema);
export const CounterModel = mongoose.model('Counter', counterSchema);

// Function to get the next sequence value for IDs
export async function getNextSequence(name: string): Promise<number> {
  const counter = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}