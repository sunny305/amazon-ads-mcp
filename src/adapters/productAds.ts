import { AmazonAdsClient } from '../client.js';

/**
 * Amazon Product Ad interface
 */
export interface AmazonProductAd {
  adId: number;
  adGroupId: number;
  campaignId: number;
  asin: string;
  sku: string;
  state: string;
}

/**
 * Fetch product ads for Sponsored Products
 * @param client - Amazon Ads API client
 * @param filters - Optional filters
 * @param paging - Pagination options
 * @returns Array of product ads
 */
export async function fetchProductAds(
  client: AmazonAdsClient,
  filters?: {
    campaign_id_filter?: string[];
    ad_group_id_filter?: string[];
    ad_id_filter?: string[];
    state?: string;
    asin?: string;
  },
  paging?: {
    start_index?: number;
    count?: number;
  }
): Promise<AmazonProductAd[]> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for product ads API');
  }

  const endpoint = '/v2/sp/productAds';

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

  if (filters?.ad_id_filter && filters.ad_id_filter.length > 0) {
    params.adIdFilter = filters.ad_id_filter.join(',');
  }

  const productAds = await client.get<AmazonProductAd[]>(endpoint, params);
  return productAds;
}
