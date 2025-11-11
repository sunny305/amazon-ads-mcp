#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createAmazonAdsClientFromRequest, UserCredentialsInput } from './client.js';
import { handleGetProfiles } from './tools/get_profiles.js';
import { handleGetCampaigns } from './tools/get_campaigns.js';
import { handleGetAdGroups } from './tools/get_ad_groups.js';
import { handleGetKeywords } from './tools/get_keywords.js';
import { handleGetProductAds } from './tools/get_product_ads.js';
import { handleGetReports } from './tools/get_reports.js';
import { handleHealthcheck } from './tools/healthcheck.js';

/**
 * MCP Server for Amazon Advertising API
 * This is the stdio transport version for local testing
 */

const server = new Server(
  {
    name: 'mcp-amazon-ads',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool definitions
 */
const tools = [
  {
    name: 'get_profiles',
    description: 'Retrieve all Amazon Ads profiles across marketplaces',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_credentials: {
          type: 'object' as const,
          properties: {
            access_token: { type: 'string' as const },
            client_id: { type: 'string' as const },
          },
          required: ['access_token', 'client_id'],
        },
      },
      required: ['user_credentials'],
    },
  },
  {
    name: 'get_campaigns',
    description: 'Fetch advertising campaigns with status and budget information',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_credentials: {
          type: 'object' as const,
          properties: {
            access_token: { type: 'string' as const },
            client_id: { type: 'string' as const },
            profile_id: { type: 'string' as const },
          },
          required: ['access_token', 'client_id', 'profile_id'],
        },
        campaign_type: { type: 'string' as const },
        filters: { type: 'object' as const },
        paging: { type: 'object' as const },
      },
      required: ['user_credentials'],
    },
  },
  {
    name: 'healthcheck',
    description: 'Check Amazon Ads MCP server health and API connectivity',
    inputSchema: {
      type: 'object' as const,
      properties: {
        user_credentials: {
          type: 'object' as const,
          properties: {
            access_token: { type: 'string' as const },
            client_id: { type: 'string' as const },
          },
          required: ['access_token', 'client_id'],
        },
      },
      required: ['user_credentials'],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
    }

    // Create client asynchronously (supports session-based token retrieval)
    const client = await createAmazonAdsClientFromRequest(args.user_credentials as UserCredentialsInput);

    let result;

    switch (name) {
      case 'get_profiles':
        result = await handleGetProfiles(client, args);
        break;
      case 'get_campaigns':
        result = await handleGetCampaigns(client, args);
        break;
      case 'get_ad_groups':
        result = await handleGetAdGroups(client, args);
        break;
      case 'get_keywords':
        result = await handleGetKeywords(client, args);
        break;
      case 'get_product_ads':
        result = await handleGetProductAds(client, args);
        break;
      case 'get_reports':
        result = await handleGetReports(client, args);
        break;
      case 'healthcheck':
        result = await handleHealthcheck(client, args);
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      error.message || 'Tool execution failed'
    );
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

}

main().catch((error) => {

  process.exit(1);
});
