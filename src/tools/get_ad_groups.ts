import { AmazonAdsClient } from '../client.js';
import { fetchAdGroups } from '../adapters/adGroups.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle get_ad_groups tool call
 */
export async function handleGetAdGroups(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_ad_groups');

  try {
    const { campaign_type, filters, paging, user_credentials } = args;

    // Set profile
    if (user_credentials?.profile_id) {
      client.setProfile(user_credentials.profile_id);
    }

    if (!client.getProfileId()) {
      throw {
        type: 'VALIDATION',
        message: 'profile_id is required in user_credentials'
      };
    }

    const campaignType = campaign_type || 'sp';
    logger.info(`Fetching ${campaignType} ad groups for profile ${client.getProfileId()}`);

    const adGroups = await fetchAdGroups(client, campaignType, filters, paging);

    logger.info(`Retrieved ${adGroups.length} ad groups`);

    return {
      ad_groups: adGroups.map((adGroup) => ({
        ad_group_id: adGroup.adGroupId.toString(),
        campaign_id: adGroup.campaignId.toString(),
        name: adGroup.name,
        state: adGroup.state,
        default_bid: adGroup.defaultBid || null,
        creation_date: adGroup.creationDate ? new Date(adGroup.creationDate).toISOString() : null,
        last_updated_date: adGroup.lastUpdatedDate ? new Date(adGroup.lastUpdatedDate).toISOString() : null
      })),
      total_count: adGroups.length,
      profile_id: client.getProfileId()
    };
  } catch (error: any) {
    logger.error('Failed to fetch ad groups', error);

    if (error.type === 'VALIDATION') {
      throw error;
    }

    throw {
      type: 'UPSTREAM',
      message: error.message,
      upstream_code: error.response?.status || null
    };
  }
}
