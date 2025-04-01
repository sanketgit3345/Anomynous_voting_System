import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebsocket } from "./websocket";
import { randomizeVoteCounts } from "@/lib/encryption";
import { z } from "zod";
import { insertPollSchema, insertVoteSchema } from "@shared/schema";
import { getRandomNumber } from "@/lib/utils";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSockets
  setupWebsocket(httpServer);
  
  // Set up authentication routes
  setupAuth(app);
  
  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const stats = await storage.getDashboardStats();
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  
  // Create a new poll
  app.post("/api/polls", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pollData = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll({
        ...pollData,
        createdBy: req.user.id
      });
      
      res.status(201).json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid poll data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create poll" });
    }
  });
  
  // Get recent polls
  app.get("/api/polls/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const polls = await storage.getRecentPolls();
      res.status(200).json(polls);
    } catch (error) {
      console.error("Error getting recent polls:", error);
      res.status(500).json({ message: "Failed to get recent polls" });
    }
  });
  
  // Get user's polls
  app.get("/api/polls/my", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const polls = await storage.getUserPolls(req.user.id);
      res.status(200).json(polls);
    } catch (error) {
      console.error("Error getting user polls:", error);
      res.status(500).json({ message: "Failed to get user polls" });
    }
  });
  
  // Get featured poll
  app.get("/api/polls/featured", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const poll = await storage.getFeaturedPoll();
      
      if (!poll) {
        return res.status(404).json({ message: "No featured poll found" });
      }
      
      const pollResults = await storage.getPollResults(poll.id);
      
      // Apply randomization for anonymity if enabled
      if (poll.isAnonymized) {
        pollResults.stats.optionCounts = randomizeVoteCounts(pollResults.stats.optionCounts);
        
        // Recalculate total votes and percentages
        const totalVotes = pollResults.stats.optionCounts.reduce((sum, count) => sum + count, 0);
        pollResults.stats.totalVotes = totalVotes;
        
        pollResults.stats.optionPercentages = pollResults.stats.optionCounts.map(count => 
          totalVotes > 0 ? (count / totalVotes) * 100 : 0
        );
        
        // Find winning option
        const maxVotes = Math.max(...pollResults.stats.optionCounts);
        pollResults.stats.winningIndex = maxVotes > 0 
          ? pollResults.stats.optionCounts.findIndex(count => count === maxVotes) 
          : null;
      }
      
      res.status(200).json({
        ...pollResults,
        // Include anonymization flag for UI
        result: {
          isAnonymized: poll.isAnonymized
        }
      });
    } catch (error) {
      console.error("Error getting featured poll:", error);
      res.status(500).json({ message: "Failed to get featured poll" });
    }
  });
  
  // Get a specific poll
  app.get("/api/polls/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      res.status(200).json(poll);
    } catch (error) {
      console.error("Error getting poll:", error);
      res.status(500).json({ message: "Failed to get poll" });
    }
  });
  
  // Get poll results
  app.get("/api/polls/:id/results", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      const pollResults = await storage.getPollResults(pollId);
      
      // Apply randomization for anonymity if enabled
      if (poll.isAnonymized) {
        pollResults.stats.optionCounts = randomizeVoteCounts(pollResults.stats.optionCounts);
        
        // Recalculate total votes and percentages
        const totalVotes = pollResults.stats.optionCounts.reduce((sum, count) => sum + count, 0);
        pollResults.stats.totalVotes = totalVotes;
        
        pollResults.stats.optionPercentages = pollResults.stats.optionCounts.map(count => 
          totalVotes > 0 ? (count / totalVotes) * 100 : 0
        );
        
        // Find winning option
        const maxVotes = Math.max(...pollResults.stats.optionCounts);
        pollResults.stats.winningIndex = maxVotes > 0 
          ? pollResults.stats.optionCounts.findIndex(count => count === maxVotes) 
          : null;
      }
      
      res.status(200).json({
        ...pollResults,
        // Include anonymization flag for UI
        result: {
          isAnonymized: poll.isAnonymized
        }
      });
    } catch (error) {
      console.error("Error getting poll results:", error);
      res.status(500).json({ message: "Failed to get poll results" });
    }
  });
  
  // Check if user has voted
  app.get("/api/polls/:id/user-vote", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pollId = parseInt(req.params.id);
      const hasVoted = await storage.hasUserVoted(pollId, req.user.id);
      
      res.status(200).json({ hasVoted });
    } catch (error) {
      console.error("Error checking if user voted:", error);
      res.status(500).json({ message: "Failed to check if user voted" });
    }
  });
  
  // Submit a vote
  app.post("/api/votes", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { pollId, optionIndex, encryptedData } = req.body;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if poll is expired
      if (new Date(poll.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This poll has ended" });
      }
      
      // Check if user has already voted
      const hasVoted = await storage.hasUserVoted(pollId, req.user.id);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted in this poll" });
      }
      
      // Check if option index is valid
      if (optionIndex < 0 || optionIndex >= (poll.options as string[]).length) {
        return res.status(400).json({ message: "Invalid option index" });
      }
      
      const vote = await storage.createVote({
        pollId,
        optionIndex,
        userId: req.user.id,
        encryptedData
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error creating vote:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vote data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vote" });
    }
  });
  
  return httpServer;
}
