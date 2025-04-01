import { users, type User, type InsertUser, polls, type Poll, type InsertPoll, votes, type Vote, type InsertVote } from "@shared/schema";
import { DashboardStats, PollResult, PollStats } from "@shared/types";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Poll operations
  createPoll(poll: InsertPoll & { createdBy: number }): Promise<Poll>;
  getPoll(id: number): Promise<Poll | undefined>;
  getRecentPolls(): Promise<Poll[]>;
  getUserPolls(userId: number): Promise<Poll[]>;
  getFeaturedPoll(): Promise<Poll | undefined>;
  
  // Vote operations
  createVote(vote: InsertVote & { userId: number }): Promise<Vote>;
  hasUserVoted(pollId: number, userId: number): Promise<boolean>;
  getPollResults(pollId: number): Promise<PollResult>;
  
  // Stats operations
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private polls: Map<number, Poll>;
  private votes: Map<number, Vote>;
  private userIdCounter: number;
  private pollIdCounter: number;
  private voteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.polls = new Map();
    this.votes = new Map();
    this.userIdCounter = 1;
    this.pollIdCounter = 1;
    this.voteIdCounter = 1;
    
    // Create a demo account
    this.createUser({
      username: "demo",
      password: "$2b$10$OTlxWKmFBOHuZHl8Wl9lDOyOozfgMqzWCMVbB9tOZoyfVx3i6FSWO", // "password"
      name: "Demo User"
    });
    
    // Create initial polls
    this.createPoll({
      title: "Should we adopt a 4-day work week?",
      description: "Looking for feedback on changing our work schedule",
      options: [
        "Yes, I would be more productive", 
        "No, I prefer the current schedule", 
        "I'd prefer a flexible schedule instead", 
        "Not sure / Need more information"
      ],
      expiresAt: this.getFutureDate(7),
      isAnonymized: true,
      createdBy: 1
    });
    
    this.createPoll({
      title: "What's your favorite programming language?",
      options: ["JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "Rust", "Other"],
      expiresAt: this.getFutureDate(14),
      isAnonymized: true,
      createdBy: 1
    });
    
    // Add some initial votes
    for (let i = 0; i < 38; i++) {
      this.createVote({
        pollId: 1,
        optionIndex: Math.floor(Math.random() * 4), // Random vote for poll 1
        userId: -i, // Use negative IDs for fake votes
        encryptedData: ""
      });
    }
    
    for (let i = 0; i < 15; i++) {
      this.createVote({
        pollId: 2,
        optionIndex: Math.floor(Math.random() * 8), // Random vote for poll 2
        userId: -i-100, // Use negative IDs for fake votes
        encryptedData: ""
      });
    }
  }
  
  private getFutureDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async createPoll(data: InsertPoll & { createdBy: number }): Promise<Poll> {
    const id = this.pollIdCounter++;
    const createdAt = new Date();
    
    const poll: Poll = {
      id,
      title: data.title,
      description: data.description || "",
      options: data.options,
      createdBy: data.createdBy,
      createdAt,
      expiresAt: data.expiresAt,
      isAnonymized: data.isAnonymized
    };
    
    this.polls.set(id, poll);
    return poll;
  }
  
  async getPoll(id: number): Promise<Poll | undefined> {
    return this.polls.get(id);
  }
  
  async getRecentPolls(): Promise<Poll[]> {
    return Array.from(this.polls.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
  
  async getUserPolls(userId: number): Promise<Poll[]> {
    return Array.from(this.polls.values())
      .filter(poll => poll.createdBy === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getFeaturedPoll(): Promise<Poll | undefined> {
    // Get the most recent poll with the most votes
    const polls = Array.from(this.polls.values());
    const now = new Date();
    
    // First try to get an active poll
    const activePolls = polls.filter(poll => new Date(poll.expiresAt) > now);
    
    if (activePolls.length === 0) {
      return polls[0]; // Return the first poll if no active polls
    }
    
    // Count votes for each poll
    const pollVotes = new Map<number, number>();
    
    // Initialize with 0 votes
    activePolls.forEach(poll => {
      pollVotes.set(poll.id, 0);
    });
    
    // Count votes
    Array.from(this.votes.values()).forEach(vote => {
      const count = pollVotes.get(vote.pollId) || 0;
      pollVotes.set(vote.pollId, count + 1);
    });
    
    // Sort by vote count
    const sortedPolls = activePolls.sort((a, b) => {
      const aVotes = pollVotes.get(a.id) || 0;
      const bVotes = pollVotes.get(b.id) || 0;
      
      // If vote count is the same, sort by creation date (newest first)
      if (aVotes === bVotes) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return bVotes - aVotes;
    });
    
    return sortedPolls[0];
  }
  
  async createVote(data: InsertVote & { userId: number }): Promise<Vote> {
    const id = this.voteIdCounter++;
    const createdAt = new Date();
    
    const vote: Vote = {
      id,
      pollId: data.pollId,
      optionIndex: data.optionIndex,
      userId: data.userId,
      encryptedData: data.encryptedData || null,
      createdAt
    };
    
    this.votes.set(id, vote);
    return vote;
  }
  
  async hasUserVoted(pollId: number, userId: number): Promise<boolean> {
    return Array.from(this.votes.values()).some(
      vote => vote.pollId === pollId && vote.userId === userId
    );
  }
  
  async getPollResults(pollId: number): Promise<PollResult> {
    const poll = await this.getPoll(pollId);
    
    if (!poll) {
      throw new Error("Poll not found");
    }
    
    const pollVotes = Array.from(this.votes.values()).filter(
      vote => vote.pollId === pollId
    );
    
    const totalVotes = pollVotes.length;
    const options = poll.options as string[];
    
    // Initialize counts for each option
    const optionCounts = Array(options.length).fill(0);
    
    // Count votes for each option
    pollVotes.forEach(vote => {
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
    const winningIndex = maxVotes > 0 ? optionCounts.findIndex(count => count === maxVotes) : null;
    
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
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const allPolls = Array.from(this.polls.values());
    const activePolls = allPolls.filter(poll => new Date(poll.expiresAt) > now);
    const totalVotes = this.votes.size;
    
    // Calculate average responses per poll
    const pollVoteCounts = new Map<number, number>();
    
    // Initialize with 0 votes
    allPolls.forEach(poll => {
      pollVoteCounts.set(poll.id, 0);
    });
    
    // Count votes for each poll
    Array.from(this.votes.values()).forEach(vote => {
      const count = pollVoteCounts.get(vote.pollId) || 0;
      pollVoteCounts.set(vote.pollId, count + 1);
    });
    
    const avgResponses = allPolls.length > 0
      ? totalVotes / allPolls.length
      : 0;
    
    return {
      totalPolls: allPolls.length,
      activePolls: activePolls.length,
      totalVotes,
      avgResponses
    };
  }
}

export const storage = new MemStorage();
