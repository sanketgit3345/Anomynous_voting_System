import { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { WebSocketMessage } from '@shared/types';
import { storage } from './storage';
import { PollResult } from '@shared/types';
import { randomizeVoteCounts } from '@/lib/encryption';
import WebSocket from 'ws';

// Map of pollId -> Set of connected WebSocket clients
const pollSubscriptions = new Map<number, Set<WebSocket>>();

export function setupWebsocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as { 
          type: string; 
          pollId?: number;
        };

        if (data.type === 'subscribe' && data.pollId) {
          // Subscribe client to poll updates
          let subscribers = pollSubscriptions.get(data.pollId);
          if (!subscribers) {
            subscribers = new Set();
            pollSubscriptions.set(data.pollId, subscribers);
          }
          subscribers.add(ws);

          // Send initial poll results
          try {
            const poll = await storage.getPoll(data.pollId);
            if (poll) {
              const pollResults = await storage.getPollResults(data.pollId);
              
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
              
              const wsMessage: WebSocketMessage = {
                type: 'vote',
                data: {
                  ...pollResults,
                  result: {
                    isAnonymized: poll.isAnonymized
                  }
                }
              };
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(wsMessage));
              }
            }
          } catch (error) {
            console.error('Error sending initial poll results:', error);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Remove client from all poll subscriptions
      for (const [pollId, subscribers] of pollSubscriptions.entries()) {
        if (subscribers.has(ws)) {
          subscribers.delete(ws);
          
          // Clean up empty subscription sets
          if (subscribers.size === 0) {
            pollSubscriptions.delete(pollId);
          }
        }
      }
    });
  });

  return wss;
}

// Broadcast poll updates to all subscribed clients
export function broadcastPollUpdate(pollId: number) {
  const subscribers = pollSubscriptions.get(pollId);
  
  if (!subscribers || subscribers.size === 0) {
    return; // No subscribers for this poll
  }
  
  storage.getPoll(pollId).then(poll => {
    if (!poll) return;
    
    storage.getPollResults(pollId).then(pollResults => {
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
      
      const wsMessage: WebSocketMessage = {
        type: 'vote',
        data: {
          ...pollResults,
          result: {
            isAnonymized: poll.isAnonymized
          }
        }
      };
      
      // Send update to all subscribers
      for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(wsMessage));
        }
      }
    }).catch(error => {
      console.error('Error getting poll results for broadcast:', error);
    });
  }).catch(error => {
    console.error('Error getting poll for broadcast:', error);
  });
}

// Update routes.ts to call this after a vote is created
export function notifyVoteCreated(pollId: number) {
  broadcastPollUpdate(pollId);
}
