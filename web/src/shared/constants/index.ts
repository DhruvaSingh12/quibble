export const AUTH_CONSTANTS = {
  ARGON2_OPTIONS: {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  },
  SESSION_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  OTP_EXPIRES_IN: 10 * 60 * 1000, // 10 minutes
  RESET_TOKEN_EXPIRES_IN: 60 * 60 * 1000, // 1 hour
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  FEED_PAGE_SIZE: 12,
  COMMENTS_PAGE_SIZE: 10,
};

export const RATE_LIMITS = {
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 min
  AUTH_MAX_REQ: 5,
  GENERAL_WINDOW_MS: 60 * 1000, // 1 min
  GENERAL_MAX_REQ: 120,
};
