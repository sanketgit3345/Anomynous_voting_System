// Basic encryption helper functions for vote anonymity

/**
 * Simple encryption function for vote data
 * In a real production app, we would use a proper encryption library
 */
export function encryptVote(userId: number, pollId: number, optionIndex: number): string {
  const data = {
    userId,
    pollId,
    optionIndex,
    timestamp: Date.now()
  };
  
  // Convert to JSON and encode to Base64
  const jsonData = JSON.stringify(data);
  return btoa(jsonData);
}

/**
 * Decrypt the vote data
 */
export function decryptVote(encryptedData: string): { userId: number; pollId: number; optionIndex: number; timestamp: number } {
  try {
    const jsonData = atob(encryptedData);
    return JSON.parse(jsonData);
  } catch (error) {
    throw new Error("Failed to decrypt vote data");
  }
}

/**
 * Add randomization to vote counts for enhanced privacy
 * Adds or subtracts up to 5% of the total votes
 */
export function randomizeVoteCount(count: number): number {
  if (count <= 1) return count; // Don't randomize if very few votes
  
  const maxVariation = Math.max(1, Math.floor(count * 0.05)); // 5% variation
  const variation = Math.floor(Math.random() * (maxVariation * 2 + 1)) - maxVariation;
  
  return Math.max(0, count + variation);
}

/**
 * Generate randomized vote counts for options based on real counts
 * This adds a small amount of noise to the data for privacy
 */
export function randomizeVoteCounts(counts: number[]): number[] {
  const totalVotes = counts.reduce((sum, count) => sum + count, 0);
  
  if (totalVotes <= 5) {
    return counts; // Don't randomize if very few votes
  }
  
  return counts.map(count => {
    return randomizeVoteCount(count);
  });
}
