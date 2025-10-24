/**
 * Metrics calculation utilities for Amazon Ads
 * All metrics follow Amazon Advertising API conventions
 */

/**
 * Calculate Click-Through Rate (CTR)
 * @param clicks - Number of clicks
 * @param impressions - Number of impressions
 * @returns CTR as decimal (0-1)
 */
export function calculateCTR(clicks: number, impressions: number): number {
  return impressions > 0 ? clicks / impressions : 0;
}

/**
 * Calculate Cost Per Click (CPC)
 * @param cost - Total cost/spend
 * @param clicks - Number of clicks
 * @returns CPC in currency units
 */
export function calculateCPC(cost: number, clicks: number): number {
  return clicks > 0 ? cost / clicks : 0;
}

/**
 * Calculate Advertising Cost of Sales (ACOS)
 * Primary metric for Amazon Ads - lower is better
 * @param cost - Total advertising spend
 * @param sales - Attributed sales
 * @returns ACOS as decimal (0-1)
 */
export function calculateACOS(cost: number, sales: number): number {
  return sales > 0 ? cost / sales : 0;
}

/**
 * Calculate Return on Ad Spend (ROAS)
 * Inverse of ACOS - higher is better
 * @param sales - Attributed sales
 * @param cost - Total advertising spend
 * @returns ROAS as multiplier
 */
export function calculateROAS(sales: number, cost: number): number {
  return cost > 0 ? sales / cost : 0;
}

/**
 * Calculate Cost Per Acquisition (CPA)
 * @param cost - Total advertising spend
 * @param conversions - Number of conversions/orders
 * @returns CPA in currency units
 */
export function calculateCPA(cost: number, conversions: number): number {
  return conversions > 0 ? cost / conversions : 0;
}

/**
 * Calculate Conversion Rate
 * @param conversions - Number of conversions/orders
 * @param clicks - Number of clicks
 * @returns Conversion rate as decimal (0-1)
 */
export function calculateConversionRate(conversions: number, clicks: number): number {
  return clicks > 0 ? conversions / clicks : 0;
}

/**
 * All metric calculations in one object for easy import
 */
export const calculateMetrics = {
  ctr: calculateCTR,
  cpc: calculateCPC,
  acos: calculateACOS,
  roas: calculateROAS,
  cpa: calculateCPA,
  conversionRate: calculateConversionRate
};
