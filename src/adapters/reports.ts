import { AmazonAdsClient } from '../client.js';
import { pollReportStatus, downloadReportData } from '../utils/reporting.js';

/**
 * Report request interface
 */
export interface ReportRequest {
  reportType: string;
  campaignType: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
  timeUnit?: string;
  filters?: {
    state?: string;
    campaign_id?: string[];
  };
}

/**
 * Report row interface (varies by report type)
 */
export interface ReportRow {
  campaignId?: number;
  adGroupId?: number;
  keywordId?: number;
  adId?: number;
  campaignName?: string;
  adGroupName?: string;
  keywordText?: string;
  asin?: string;
  date?: string;
  impressions?: number;
  clicks?: number;
  cost?: number;
  attributedSales14d?: number;
  attributedConversions14d?: number;
  attributedUnitsOrdered14d?: number;
  [key: string]: any;
}

/**
 * Generate and retrieve a report
 * This handles the async nature of Amazon's reporting API:
 * 1. Request report generation
 * 2. Poll for completion
 * 3. Download report data
 *
 * @param client - Amazon Ads API client
 * @param request - Report request parameters
 * @returns Report data
 */
export async function generateReport(
  client: AmazonAdsClient,
  request: ReportRequest
): Promise<ReportRow[]> {
  if (!client.getProfileId()) {
    throw new Error('Profile ID is required for reports API');
  }

  // Build report endpoint based on campaign type and report type
  const reportEndpoint = buildReportEndpoint(request.campaignType, request.reportType);

  // Build report request body
  const reportBody: any = {
    reportDate: request.startDate,
    metrics: request.metrics?.join(',') || buildDefaultMetrics(request.reportType)
  };

  // Add optional parameters
  if (request.timeUnit) {
    reportBody.timeUnit = request.timeUnit;
  }

  if (request.filters?.state) {
    reportBody.segment = request.filters.state;
  }

  if (request.filters?.campaign_id && request.filters.campaign_id.length > 0) {
    reportBody.campaignIdFilter = request.filters.campaign_id.join(',');
  }

  // Step 1: Request report generation
  const reportResponse = await client.post<{ reportId: string }>(reportEndpoint, reportBody);
  const reportId = reportResponse.reportId;

  // Step 2: Poll for report completion (max 60 seconds)
  const status = await pollReportStatus(client, reportId, 30, 2000);

  if (!status.location) {
    throw new Error('Report completed but no download URL provided');
  }

  // Step 3: Download report data
  const reportData = await downloadReportData(status.location);

  // Handle different report formats (array or single object)
  if (Array.isArray(reportData)) {
    return reportData;
  } else {
    return [reportData];
  }
}

/**
 * Build report endpoint URL
 * @param campaignType - sp, sb, or sd
 * @param reportType - campaigns, adGroups, keywords, productAds
 * @returns API endpoint path
 */
function buildReportEndpoint(campaignType: string, reportType: string): string {
  return `/v2/${campaignType}/${reportType}/report`;
}

/**
 * Build default metrics list for report type
 * @param reportType - Type of report
 * @returns Comma-separated metrics string
 */
function buildDefaultMetrics(reportType: string): string {
  const baseMetrics = [
    'impressions',
    'clicks',
    'cost',
    'attributedSales14d',
    'attributedConversions14d'
  ];

  return baseMetrics.join(',');
}

/**
 * Simplified report generation for common use cases
 * Gets last N days of performance data
 * @param client - Amazon Ads API client
 * @param campaignType - Campaign type
 * @param reportType - Report type
 * @param startDate - Start date (YYYYMMDD)
 * @param endDate - End date (YYYYMMDD)
 * @returns Report data
 */
export async function getPerformanceReport(
  client: AmazonAdsClient,
  campaignType: string,
  reportType: string,
  startDate: string,
  endDate: string
): Promise<ReportRow[]> {
  return await generateReport(client, {
    reportType,
    campaignType,
    startDate,
    endDate,
    timeUnit: 'SUMMARY'
  });
}
