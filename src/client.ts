import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Amazon Ads API credentials interface
 */
export interface AmazonAdsCredentials {
  access_token: string;
  client_id: string;
  profile_id?: string; // Optional at client level, required for most operations
}

/**
 * Amazon Ads API Client
 * Handles communication with Amazon Advertising API
 */
export class AmazonAdsClient {
  private client: AxiosInstance;
  private clientId: string;
  private profileId?: string;

  constructor(credentials: AmazonAdsCredentials) {
    this.clientId = credentials.client_id;
    this.profileId = credentials.profile_id;

    // Create axios instance with default headers
    this.client = axios.create({
      baseURL: 'https://advertising-api.amazon.com',
      headers: {
        'Authorization': `Bearer ${credentials.access_token}`,
        'Amazon-Advertising-API-ClientId': credentials.client_id,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add profile_id to scope header if provided
    if (credentials.profile_id) {
      this.client.defaults.headers['Amazon-Advertising-API-Scope'] = credentials.profile_id;
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data: any = error.response.data;

          // Handle common Amazon API errors
          if (status === 401) {
            throw new Error('Invalid or expired access token');
          } else if (status === 403) {
            throw new Error('Access forbidden - check profile_id and permissions');
          } else if (status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 60;
            throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
          } else if (status >= 500) {
            throw new Error('Amazon API server error. Please try again later');
          } else if (data?.code) {
            throw new Error(`Amazon API error: ${data.code} - ${data.details || 'Unknown error'}`);
          }
        }
        throw error;
      }
    );
  }

  /**
   * Set profile_id for subsequent requests
   * @param profileId - Amazon Ads profile ID
   */
  setProfile(profileId: string): void {
    this.profileId = profileId;
    this.client.defaults.headers['Amazon-Advertising-API-Scope'] = profileId;
  }

  /**
   * Get current profile_id
   * @returns Current profile ID or undefined
   */
  getProfileId(): string | undefined {
    return this.profileId;
  }

  /**
   * Perform GET request
   * @param path - API endpoint path
   * @param params - Query parameters
   * @returns Response data
   */
  async get<T = any>(path: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(path, { params });
    return response.data;
  }

  /**
   * Perform POST request
   * @param path - API endpoint path
   * @param data - Request body
   * @returns Response data
   */
  async post<T = any>(path: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(path, data);
    return response.data;
  }

  /**
   * Perform PUT request
   * @param path - API endpoint path
   * @param data - Request body
   * @returns Response data
   */
  async put<T = any>(path: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(path, data);
    return response.data;
  }

  /**
   * Perform DELETE request
   * @param path - API endpoint path
   * @returns Response data
   */
  async delete<T = any>(path: string): Promise<T> {
    const response = await this.client.delete<T>(path);
    return response.data;
  }
}

/**
 * Create Amazon Ads client from user credentials
 * Validates required fields and returns initialized client
 * @param userCredentials - User credentials object
 * @returns Initialized AmazonAdsClient
 * @throws Error if required credentials are missing
 */
export function createAmazonAdsClientFromRequest(userCredentials: any): AmazonAdsClient {
  if (!userCredentials || !userCredentials.access_token) {
    throw new Error('Missing access_token in user_credentials');
  }
  if (!userCredentials.client_id) {
    throw new Error('Missing client_id in user_credentials');
  }

  return new AmazonAdsClient({
    access_token: userCredentials.access_token,
    client_id: userCredentials.client_id,
    profile_id: userCredentials.profile_id
  });
}
