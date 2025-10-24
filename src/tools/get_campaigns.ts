import { AmazonAdsClient } from '../client.js';
import { fetchCampaigns } from '../adapters/campaigns.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle get_campaigns tool call
 * Retrieves campaigns for a specific profile
 */
export async function handleGetCampaigns(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_campaigns');

  try {
    const { campaign_type, filters, include_extended, paging, user_credentials } = args;

    // Ensure profile_id is set
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
    logger.info(`Fetching ${campaignType} campaigns for profile ${client.getProfileId()}`);

    const campaigns = await fetchCampaigns(client, campaignType, filters, paging);

    logger.info(`Retrieved ${campaigns.length} campaigns`);

    return {
      campaigns: campaigns.map((campaign) => ({
        campaign_id: campaign.campaignId.toString(),
        name: campaign.name,
        campaign_type: mapCampaignType(campaignType),
        targeting_type: campaign.targetingType || null,
        state: campaign.state,
        daily_budget: campaign.dailyBudget || campaign.budget?.budget || null,
        start_date: campaign.startDate,
        end_date: campaign.endDate || null,
        premium_bid_adjustment: campaign.premiumBidAdjustment || false,
        bidding_strategy: campaign.bidding?.strategy || null,
        portfolio_id: campaign.portfolioId?.toString() || null,
        creation_date: campaign.creationDate ? new Date(campaign.creationDate).toISOString() : null,
        last_updated_date: campaign.lastUpdatedDate ? new Date(campaign.lastUpdatedDate).toISOString() : null
      })),
      total_count: campaigns.length,
      profile_id: client.getProfileId()
    };
  } catch (error: any) {
    logger.error('Failed to fetch campaigns', error);

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

/**
 * Map campaign type code to full name
 */
function mapCampaignType(type: string): string {
  const mapping: Record<string, string> = {
    'sp': 'sponsoredProducts',
    'sb': 'sponsoredBrands',
    'sd': 'sponsoredDisplay'
  };
  return mapping[type] || type;
}
