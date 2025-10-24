import { AmazonAdsClient } from '../client.js';

/**
 * Amazon Ads Profile interface
 */
export interface AmazonAdsProfile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  accountInfo?: {
    marketplaceStringId: string;
    name: string;
    type: string;
  };
}

/**
 * Fetch all advertising profiles for the authenticated user
 * @param client - Amazon Ads API client
 * @returns Array of profiles
 */
export async function fetchProfiles(client: AmazonAdsClient): Promise<AmazonAdsProfile[]> {
  const profiles = await client.get<AmazonAdsProfile[]>('/v2/profiles');
  return profiles;
}

/**
 * Fetch a specific profile by ID
 * @param client - Amazon Ads API client
 * @param profileId - Profile ID
 * @returns Profile details
 */
export async function fetchProfile(
  client: AmazonAdsClient,
  profileId: string
): Promise<AmazonAdsProfile> {
  const profile = await client.get<AmazonAdsProfile>(`/v2/profiles/${profileId}`);
  return profile;
}
