import { apiRequest } from './client';

export const leaderboardAPI = {
  get: async (limit: number = 10) => {
    return apiRequest(`/leaderboard?limit=${limit}`);
  },
};

