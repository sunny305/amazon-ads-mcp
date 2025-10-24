/**
 * Date utilities for Amazon Ads API
 * Amazon uses YYYYMMDD format (compact, no separators)
 */

/**
 * Convert Date object or ISO string to Amazon date format (YYYYMMDD)
 * @param date - Date object or ISO date string
 * @returns Date in YYYYMMDD format
 */
export function toAmazonDateFormat(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Convert Amazon date format (YYYYMMDD) to Date object
 * @param dateStr - Date string in YYYYMMDD format
 * @returns Date object
 */
export function fromAmazonDateFormat(dateStr: string): Date {
  if (dateStr.length !== 8) {
    throw new Error(`Invalid Amazon date format: ${dateStr}. Expected YYYYMMDD`);
  }

  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
  const day = parseInt(dateStr.substring(6, 8));

  return new Date(year, month, day);
}

/**
 * Get date range for the last N days in Amazon format
 * @param days - Number of days to look back
 * @returns Object with start_date and end_date in YYYYMMDD format
 */
export function getDateRange(days: number): { start_date: string; end_date: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return {
    start_date: toAmazonDateFormat(start),
    end_date: toAmazonDateFormat(end)
  };
}

/**
 * Get current date in Amazon format
 * @returns Today's date in YYYYMMDD format
 */
export function getToday(): string {
  return toAmazonDateFormat(new Date());
}

/**
 * Get yesterday's date in Amazon format
 * @returns Yesterday's date in YYYYMMDD format
 */
export function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toAmazonDateFormat(yesterday);
}

/**
 * Validate Amazon date format
 * @param dateStr - Date string to validate
 * @returns true if valid YYYYMMDD format
 */
export function isValidAmazonDate(dateStr: string): boolean {
  if (!/^\d{8}$/.test(dateStr)) {
    return false;
  }

  try {
    const date = fromAmazonDateFormat(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
