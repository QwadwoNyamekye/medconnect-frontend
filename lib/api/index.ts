// Centralized API exports
export { apiRequest, getToken } from './client';
export * from './auth';
export * from './cases';
export * from './answers';
export * from './users';
export * from './conversations';
export * from './hospitals';
export * from './leaderboard';
export * from './admin';

// Re-export all API objects for convenience
export { authAPI } from './auth';
export { casesAPI } from './cases';
export { answersAPI } from './answers';
export { usersAPI } from './users';
export { conversationsAPI } from './conversations';
export { hospitalsAPI } from './hospitals';
export { leaderboardAPI } from './leaderboard';
export { adminAPI } from './admin';

