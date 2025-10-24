import { AmazonAdsClient } from '../client.js';

/**
 * Amazon Ads Ad Group interface
 */
export interface AmazonAdGroup {
  adGroupId: number;
  campaignId: number;
  name: string;
  state: string;
  defaultBid?: number;
  creationDate?: number;
  lastUpdatedDate?: number;
  servingStatus?: string;
}

/**
 * Fetch ad groups for a profile
 * @param client - Amazon Ads API client
 * @param campaignType - Campaign type (sp, sb, sd)
 * @param filters - Optional filters
 * @param paging - Pagination options
 * @returns Array of ad groups
 */
export async function fetchAdGroups(
  client: AmazonAdsClient,
  campaignType: string = 'sp',
  filters?: {
    campaign_id_filter?: string[];
    ad_group_id_filter?: string[];
    state?: string;
    name?: string;
  },
  paging?: {
    start_index?: number;
    count?: number;
  }
): Promise<AmazonAdGroup[]> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for ad groups API');
  }

  const endpoint = `/v2/${campaignType}/adGroups`;

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

  if (filters?.ad_group_id_filter && filters.ad_group_id_filter.length > 0) {
    params.adGroupIdFilter = filters.ad_group_id_filter.join(',');
  }

  if (filters?.name) {
    params.name = filters.name;
  }

  const adGroups = await client.get<AmazonAdGroup[]>(endpoint, params);
  return adGroups;
}
