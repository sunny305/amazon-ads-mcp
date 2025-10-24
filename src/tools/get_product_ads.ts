import { AmazonAdsClient } from '../client.js';
import { fetchProductAds } from '../adapters/productAds.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle get_product_ads tool call
 */
export async function handleGetProductAds(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_product_ads');

  try {
    const { filters, paging, user_credentials } = args;

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

    logger.info(`Fetching product ads for profile ${client.getProfileId()}`);

    const productAds = await fetchProductAds(client, filters, paging);

    logger.info(`Retrieved ${productAds.length} product ads`);

    return {
      product_ads: productAds.map((ad) => ({
        ad_id: ad.adId.toString(),
        ad_group_id: ad.adGroupId.toString(),
        campaign_id: ad.campaignId.toString(),
        asin: ad.asin,
        sku: ad.sku,
        state: ad.state
      })),
      total_count: productAds.length,
      profile_id: client.getProfileId()
    };
  } catch (error: any) {
    logger.error('Failed to fetch product ads', error);

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
