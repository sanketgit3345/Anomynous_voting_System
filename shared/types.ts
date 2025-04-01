export interface PollStats {
  totalVotes: number;
  optionCounts: number[];
  optionPercentages: number[];
  winningIndex: number | null;
}

export interface PollResult {
  pollId: number;
  pollTitle: string;
  options: string[];
  stats: PollStats;
}

export interface DashboardStats {
  totalPolls: number;
  activePolls: number;
  totalVotes: number;
  avgResponses: number;
}

export interface WebSocketMessage {
  type: 'vote' | 'newPoll' | 'pollUpdated' | 'error';
  data: any;
}
