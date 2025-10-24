import { AmazonAdsClient } from '../client.js';
import { sleep } from './retry.js';
import axios from 'axios';

/**
 * Report status from Amazon API
 */
export interface ReportStatus {
  reportId: string;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';
  statusDetails?: string;
  location?: string;
  fileSize?: number;
  expiresAt?: number;
}

/**
 * Poll for report completion
 * @param client - Amazon Ads API client
 * @param reportId - Report ID to poll
 * @param maxAttempts - Maximum polling attempts
 * @param pollIntervalMs - Interval between polls in milliseconds
 * @returns Report status when complete
 */
export async function pollReportStatus(
  client: AmazonAdsClient,
  reportId: string,
  maxAttempts: number = 30,
  pollIntervalMs: number = 2000
): Promise<ReportStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await client.get<ReportStatus>(`/v2/reports/${reportId}`);

    if (status.status === 'SUCCESS') {
      return status;
    } else if (status.status === 'FAILURE') {
      throw new Error(`Report generation failed: ${status.statusDetails || 'Unknown error'}`);
    }

    // Report still in progress
    attempts++;
    if (attempts < maxAttempts) {
      await sleep(pollIntervalMs);
    }
  }

  throw new Error(`Report generation timeout after ${maxAttempts} attempts`);
}

/**
 * Download report data from S3 URL
 * @param url - S3 download URL
 * @returns Report data (parsed JSON or raw data)
 */
export async function downloadReportData(url: string): Promise<any> {
  try {
    const response = await axios.get(url, {
      timeout: 30000,
      // Amazon reports can be JSON or gzipped JSON
      headers: {
        'Accept': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to download report: ${error.message}`);
  }
}
