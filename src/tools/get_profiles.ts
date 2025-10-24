import { AmazonAdsClient } from '../client.js';
import { fetchProfiles } from '../adapters/profiles.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle get_profiles tool call
 * Retrieves all Amazon Ads profiles for the authenticated user
 */
export async function handleGetProfiles(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_profiles');

  try {
    logger.info('Fetching Amazon Ads profiles');

    const profiles = await fetchProfiles(client);

    logger.info(`Retrieved ${profiles.length} profiles`);

    return {
      profiles: profiles.map((profile) => ({
        profile_id: profile.profileId.toString(),
        country_code: profile.countryCode,
        currency_code: profile.currencyCode,
        timezone: profile.timezone,
        marketplace_id: profile.accountInfo?.marketplaceStringId || null,
        name: profile.accountInfo?.name || `Profile ${profile.profileId}`,
        type: profile.accountInfo?.type || 'seller'
      })),
      total_count: profiles.length
    };
  } catch (error: any) {
    logger.error('Failed to fetch profiles', error);
    throw {
      type: 'UPSTREAM',
      message: error.message,
      upstream_code: error.response?.status || null
    };
  }
}
