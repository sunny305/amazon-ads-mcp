import axios from 'axios';

/**
 * Backend Token Retrieval Utility
 * Fetches platform-specific OAuth tokens from the backend using session tokens
 */

export interface UserCredentials {
  sessionToken?: string;
  access_token?: string; // Legacy support
}

export interface PlatformTokens {
  access_token: string;
  [key: string]: any; // Allow additional fields
}

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.chatwithads.com';
const TOKEN_ENDPOINT = `${BACKEND_API_URL}/api/mcp/tokens`;

/**
 * Retrieve platform tokens using session token
 * @param userCredentials - User credentials object containing sessionToken
 * @param platform - Platform name (facebook_ads, google_ads, etc.)
 * @returns Platform-specific tokens
 * @throws Error if session token is invalid or platform tokens not available
 */
export async function retrievePlatformTokens(
  userCredentials: UserCredentials,
  platform: string
): Promise<PlatformTokens> {
  // Legacy support: if access_token is directly provided, use it
  if (userCredentials.access_token && !userCredentials.sessionToken) {
    console.warn('[TokenRetrieval] Using legacy access_token (deprecated - use sessionToken)');
    return { access_token: userCredentials.access_token };
  }

  // Extract session token
  const sessionToken = userCredentials.sessionToken;

  if (!sessionToken) {
    throw new Error('Missing sessionToken in user_credentials');
  }

  try {
    console.log(`[TokenRetrieval] Fetching ${platform} tokens from backend...`);

    const response = await axios.post(
      TOKEN_ENDPOINT,
      {
        sessionToken,
        platform
      },
      {
        timeout: 5000, // 5 second timeout for token retrieval
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to retrieve tokens');
    }

    const tokens = response.data.tokens;

    if (!tokens || !tokens.access_token) {
      throw new Error(`No access token available for platform: ${platform}`);
    }

    console.log(`[TokenRetrieval] Successfully retrieved ${platform} tokens`);
    return tokens;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      if (status === 404) {
        throw new Error(`Session not found or no ${platform} connection available. User may need to reconnect their account.`);
      }

      if (status === 400) {
        throw new Error(`Invalid session token or platform: ${message}`);
      }

      console.error(`[TokenRetrieval] Backend API error:`, {
        status,
        message,
        platform
      });

      throw new Error(`Failed to retrieve tokens from backend: ${message}`);
    }

    throw error;
  }
}

/**
 * Extract access token from user credentials (handles both session and legacy)
 * @param userCredentials - User credentials
 * @param platform - Platform name
 * @returns Access token string
 */
export async function getAccessToken(
  userCredentials: UserCredentials,
  platform: string
): Promise<string> {
  const tokens = await retrievePlatformTokens(userCredentials, platform);
  return tokens.access_token;
}
