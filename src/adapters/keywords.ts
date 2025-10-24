import { AmazonAdsClient } from '../client.js';

/**
 * Amazon Ads Keyword interface
 */
export interface AmazonKeyword {
  keywordId: number;
  adGroupId: number;
  campaignId: number;
  keywordText: string;
  matchType: string;
  state: string;
  bid?: number;
  nativeLanguageKeyword?: string;
}

/**
 * Fetch keywords for Sponsored Products
 * @param client - Amazon Ads API client
 * @param filters - Optional filters
 * @param paging - Pagination options
 * @returns Array of keywords
 */
export async function fetchKeywords(
  client: AmazonAdsClient,
  filters?: {
    campaign_id_filter?: string[];
    ad_group_id_filter?: string[];
    keyword_id_filter?: string[];
    state?: string;
    match_type?: string;
  },
  paging?: {
    start_index?: number;
    count?: number;
  }
): Promise<AmazonKeyword[]> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for keywords API');
  }

  const endpoint = '/v2/sp/keywords';

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

  if (filters?.keyword_id_filter && filters.keyword_id_filter.length > 0) {
    params.keywordIdFilter = filters.keyword_id_filter.join(',');
  }

  if (filters?.match_type) {
    params.matchTypeFilter = filters.match_type;
  }

  const keywords = await client.get<AmazonKeyword[]>(endpoint, params);
  return keywords;
}
