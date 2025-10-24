import { AmazonAdsClient } from '../client.js';
import { generateReport } from '../adapters/reports.js';
import { createLogger } from '../utils/logger.js';
import { calculateMetrics } from '../utils/metrics.js';

/**
 * Handle get_reports tool call
 * Generates performance reports with metrics
 */
export async function handleGetReports(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('get_reports');

  try {
    const {
      report_type,
      campaign_type,
      date_range,
      metrics,
      filters,
      time_unit,
      user_credentials
    } = args;

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

    if (!date_range || !date_range.start_date || !date_range.end_date) {
      throw {
        type: 'VALIDATION',
        message: 'date_range with start_date and end_date is required'
      };
    }

    logger.info(`Generating ${report_type || 'campaigns'} report for profile ${client.getProfileId()}`);

    const reportData = await generateReport(client, {
      reportType: report_type || 'campaigns',
      campaignType: campaign_type || 'sp',
      startDate: date_range.start_date,
      endDate: date_range.end_date,
      metrics: metrics || ['impressions', 'clicks', 'cost', 'attributedSales14d', 'attributedConversions14d'],
      timeUnit: time_unit || 'SUMMARY',
      filters
    });

    logger.info(`Report generated with ${reportData.length} rows`);

    // Process and calculate derived metrics
    const processedData = reportData.map((row) => {
      const clicks = row.clicks || 0;
      const impressions = row.impressions || 0;
      const cost = row.cost || 0;
      const sales = row.attributedSales14d || 0;
      const conversions = row.attributedConversions14d || 0;

      return {
        entity_id: (row.campaignId || row.adGroupId || row.keywordId || row.adId)?.toString() || null,
        entity_name: row.campaignName || row.adGroupName || row.keywordText || row.asin || null,
        date: row.date || null,
        impressions,
        clicks,
        cost: Number(cost.toFixed(2)),
        sales: Number(sales.toFixed(2)),
        orders: conversions,
        ctr: Number(calculateMetrics.ctr(clicks, impressions).toFixed(4)),
        cpc: Number(calculateMetrics.cpc(cost, clicks).toFixed(2)),
        acos: Number(calculateMetrics.acos(cost, sales).toFixed(4)),
        roas: Number(calculateMetrics.roas(sales, cost).toFixed(2)),
        conversions
      };
    });

    // Calculate summary
    const summary = {
      total_impressions: processedData.reduce((sum, r) => sum + r.impressions, 0),
      total_clicks: processedData.reduce((sum, r) => sum + r.clicks, 0),
      total_cost: Number(processedData.reduce((sum, r) => sum + r.cost, 0).toFixed(2)),
      total_sales: Number(processedData.reduce((sum, r) => sum + r.sales, 0).toFixed(2)),
      total_orders: processedData.reduce((sum, r) => sum + r.orders, 0),
      avg_ctr: 0,
      avg_cpc: 0,
      overall_acos: 0,
      overall_roas: 0
    };

    summary.avg_ctr = Number(calculateMetrics.ctr(summary.total_clicks, summary.total_impressions).toFixed(4));
    summary.avg_cpc = Number(calculateMetrics.cpc(summary.total_cost, summary.total_clicks).toFixed(2));
    summary.overall_acos = Number(calculateMetrics.acos(summary.total_cost, summary.total_sales).toFixed(4));
    summary.overall_roas = Number(calculateMetrics.roas(summary.total_sales, summary.total_cost).toFixed(2));

    return {
      report_data: processedData,
      summary,
      date_range: {
        start_date: date_range.start_date,
        end_date: date_range.end_date
      },
      profile_id: client.getProfileId(),
      currency: 'USD' // TODO: Get from profile currency code
    };
  } catch (error: any) {
    logger.error('Failed to generate report', error);

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
