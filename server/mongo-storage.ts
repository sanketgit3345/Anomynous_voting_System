import { MongoClient } from 'mongodb';
import { User, InsertUser, Poll, InsertPoll, Vote, InsertVote } from '@shared/schema';
import { DashboardStats, PollResult, PollStats } from '@shared/types';
import { IStorage } from './storage';
import { UserModel, PollModel, VoteModel, getNextSequence } from './models';
import { randomizeVoteCount } from '@/lib/encryption';

class MongoStorage implements IStorage {
  private client: MongoClient | null = null;

  constructor() {
    // Constructor is empty as we initialize in a separate method
  }

  // Initialize MongoDB connection
  async initialize() {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MongoDB URI not provided in environment variables');
      }

      console.log('MongoDB storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MongoDB storage:', error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ id }).lean();
      return user ? user as User : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username }).lean();
      return user ? user as User : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const id = await getNextSequence('userId');
      const newUser = new UserModel({ ...user, id });
      await newUser.save();
      return newUser.toObject() as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Poll operations
  async createPoll(poll: InsertPoll & { createdBy: number }): Promise<Poll> {
    try {
      const id = await getNextSequence('pollId');
      const newPoll = new PollModel({ 
        ...poll, 
        id,
        createdAt: new Date() 
      });
      await newPoll.save();
      return newPoll.toObject() as Poll;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    }
  }

  async getPoll(id: number): Promise<Poll | undefined> {
    try {
      const poll = await PollModel.findOne({ id }).lean();
      return poll ? poll as Poll : undefined;
    } catch (error) {
      console.error('Error getting poll:', error);
      throw error;
    }
  }

  async getRecentPolls(): Promise<Poll[]> {
    try {
      const polls = await PollModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      return polls as Poll[];
    } catch (error) {
      console.error('Error getting recent polls:', error);
      throw error;
    }
  }

  async getUserPolls(userId: number): Promise<Poll[]> {
    try {
      const polls = await PollModel.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .lean();
      return polls as Poll[];
    } catch (error) {
      console.error('Error getting user polls:', error);
      throw error;
    }
  }

  async getFeaturedPoll(): Promise<Poll | undefined> {
    try {
      // Get active polls
      const now = new Date();
      const activePolls = await PollModel.find({ expiresAt: { $gt: now } }).lean();
      
      if (activePolls.length === 0) {
        // If no active polls, return the most recent poll
        const recentPoll = await PollModel.findOne()
          .sort({ createdAt: -1 })
          .lean();
        return recentPoll ? recentPoll as Poll : undefined;
      }
      
      // Get poll with most votes
      const pollVoteCounts = await Promise.all(
        activePolls.map(async (poll) => {
          const voteCount = await VoteModel.countDocuments({ pollId: poll.id });
          return { poll, voteCount };
        })
      );
      
      // Sort by vote count (desc) and then by creation date (desc)
      pollVoteCounts.sort((a, b) => {
        if (a.voteCount !== b.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return new Date(b.poll.createdAt).getTime() - new Date(a.poll.createdAt).getTime();
      });
      
      return pollVoteCounts.length > 0 ? pollVoteCounts[0].poll as Poll : undefined;
    } catch (error) {
      console.error('Error getting featured poll:', error);
      throw error;
    }
  }

  // Vote operations
  async createVote(vote: InsertVote & { userId: number }): Promise<Vote> {
    try {
      const id = await getNextSequence('voteId');
      const newVote = new VoteModel({ 
        ...vote, 
        id,
        createdAt: new Date() 
      });
      await newVote.save();
      return newVote.toObject() as Vote;
    } catch (error) {
      console.error('Error creating vote:', error);
      throw error;
    }
  }

  async hasUserVoted(pollId: number, userId: number): Promise<boolean> {
    try {
      const vote = await VoteModel.findOne({ pollId, userId });
      return !!vote;
    } catch (error) {
      console.error('Error checking if user voted:', error);
      throw error;
    }
  }

  async getPollResults(pollId: number): Promise<PollResult> {
    try {
      const poll = await PollModel.findOne({ id: pollId });
      if (!poll) {
        throw new Error('Poll not found');
      }
      
      const options = poll.options as string[];
      
      // Get all votes for this poll
      const votes = await VoteModel.find({ pollId });
      const totalVotes = votes.length;
      
      // Initialize counts for each option
      const optionCounts = Array(options.length).fill(0);
      
      // Count votes for each option
      votes.forEach(vote => {
        if (vote.optionIndex >= 0 && vote.optionIndex < options.length) {
          optionCounts[vote.optionIndex]++;
        }
      });
      
      // Calculate percentages
      const optionPercentages = optionCounts.map(count => 
        totalVotes > 0 ? (count / totalVotes) * 100 : 0
      );
      
      // Find winning option
      const maxVotes = Math.max(...optionCounts);
      const winningIndex = maxVotes > 0 ? 
        optionCounts.findIndex(count => count === maxVotes) : null;
      
      const stats: PollStats = {
        totalVotes,
        optionCounts,
        optionPercentages,
        winningIndex
      };
      
      return {
        pollId: poll.id,
        pollTitle: poll.title,
        options,
        stats
      };
    } catch (error) {
      console.error('Error getting poll results:', error);
      throw error;
    }
  }

  // Stats operations
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      
      const totalPolls = await PollModel.countDocuments();
      const activePolls = await PollModel.countDocuments({ expiresAt: { $gt: now } });
      const totalVotes = await VoteModel.countDocuments();
      
      let avgResponses = 0;
      if (totalPolls > 0) {
        avgResponses = totalVotes / totalPolls;
      }
      
      return {
        totalPolls,
        activePolls,
        totalVotes,
        avgResponses
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const mongoStorage = new MongoStorage();