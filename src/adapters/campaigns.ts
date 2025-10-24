import { AmazonAdsClient } from '../client.js';

/**
 * Amazon Ads Campaign interface
 */
export interface AmazonCampaign {
  campaignId: number;
  name: string;
  campaignType?: string;
  targetingType?: string;
  state: string;
  dailyBudget?: number;
  budget?: {
    budgetType: string;
    budget: number;
  };
  startDate: string;
  endDate?: string;
  premiumBidAdjustment?: boolean;
  bidding?: {
    strategy: string;
    adjustments?: any[];
  };
  portfolioId?: number;
  creationDate?: number;
  lastUpdatedDate?: number;
  servingStatus?: string;
}

/**
 * Fetch campaigns for a profile
 * @param client - Amazon Ads API client
 * @param campaignType - Campaign type (sp, sb, sd)
 * @param filters - Optional filters
 * @param paging - Pagination options
 * @returns Array of campaigns
 */
export async function fetchCampaigns(
  client: AmazonAdsClient,
  campaignType: string = 'sp',
  filters?: {
    state?: string;
    name?: string;
    campaign_id_filter?: string[];
  },
  paging?: {
    start_index?: number;
    count?: number;
  }
): Promise<AmazonCampaign[]> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for campaigns API');
  }

  const endpoint = `/v2/${campaignType}/campaigns`;

  const params: any = {
    startIndex: paging?.start_index || 0,
    count: Math.min(paging?.count || 100, 100)
  };

  if (filters?.state) {
    params.stateFilter = filters.state;
  }

  if (filters?.campaign_id_filter && filters.campaign_id_filter.length > 0) {
    params.campaignIdFilter = filters.campaign_id_filter.join(',');
  }

  if (filters?.name) {
    params.name = filters.name;
  }

  const campaigns = await client.get<AmazonCampaign[]>(endpoint, params);
  return campaigns;
}

/**
 * Fetch a specific campaign
 * @param client - Amazon Ads API client
 * @param campaignType - Campaign type (sp, sb, sd)
 * @param campaignId - Campaign ID
 * @returns Campaign details
 */
export async function fetchCampaign(
  client: AmazonAdsClient,
  campaignType: string,
  campaignId: string
): Promise<AmazonCampaign> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for campaigns API');
  }

  const endpoint = `/v2/${campaignType}/campaigns/${campaignId}`;
  const campaign = await client.get<AmazonCampaign>(endpoint);
  return campaign;
}
