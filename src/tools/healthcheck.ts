import { AmazonAdsClient } from '../client.js';
import { fetchProfiles } from '../adapters/profiles.js';
import { createLogger } from '../utils/logger.js';

/**
 * Handle healthcheck tool call
 * Checks MCP server health and Amazon API connectivity
 */
export async function handleHealthcheck(
  client: AmazonAdsClient,
  args: any
): Promise<any> {
  const logger = createLogger({ service: 'mcp-amazon-ads' }).withTool('healthcheck');

  const startTime = Date.now();
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let apiConnectivity = false;
  let profilesAccessible = false;
  let profileCount = 0;

  try {
    logger.info('Running health check');

    // Test API connectivity by fetching profiles
    const profiles = await fetchProfiles(client);

    apiConnectivity = true;
    profilesAccessible = true;
    profileCount = profiles.length;

    logger.info('Health check passed');
  } catch (error: any) {
    logger.warn('Health check failed', error);

    status = 'unhealthy';

    // Determine if it's degraded or fully unhealthy
    if (error.response?.status === 401 || error.response?.status === 403) {
      status = 'unhealthy'; // Auth issues are critical
    } else if (error.response?.status >= 500) {
      status = 'degraded'; // Server errors might be temporary
    }
  }

  const apiResponseTime = Date.now() - startTime;

  return {
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    api_connectivity: apiConnectivity,
    api_response_time_ms: apiResponseTime,
    profiles_accessible: profilesAccessible,
    profile_count: profileCount
  };
}
