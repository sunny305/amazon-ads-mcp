import { AmazonAdsClient } from '../client.js';
import { fetchKeywords } from '../adapters/keywords.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle get_keywords tool call
 */
export async function handleGetKeywords(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_keywords');

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

    logger.info(`Fetching keywords for profile ${client.getProfileId()}`);

    const keywords = await fetchKeywords(client, filters, paging);

    logger.info(`Retrieved ${keywords.length} keywords`);

    return {
      keywords: keywords.map((keyword) => ({
        keyword_id: keyword.keywordId.toString(),
        ad_group_id: keyword.adGroupId.toString(),
        campaign_id: keyword.campaignId.toString(),
        keyword_text: keyword.keywordText,
        match_type: keyword.matchType,
        state: keyword.state,
        bid: keyword.bid || null,
        native_language_keyword: keyword.nativeLanguageKeyword || null
      })),
      total_count: keywords.length,
      profile_id: client.getProfileId()
    };
  } catch (error: any) {
    logger.error('Failed to fetch keywords', error);

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
