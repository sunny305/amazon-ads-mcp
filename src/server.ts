import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createAmazonAdsClientFromRequest } from './client.js';
import { handleGetProfiles } from './tools/get_profiles.js';
import { handleGetCampaigns } from './tools/get_campaigns.js';
import { handleGetAdGroups } from './tools/get_ad_groups.js';
import { handleGetKeywords } from './tools/get_keywords.js';
import { handleGetProductAds } from './tools/get_product_ads.js';
import { handleGetReports } from './tools/get_reports.js';
import { handleHealthcheck } from './tools/healthcheck.js';
import { createLogger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const logger = createLogger({ service: 'mcp-amazon-ads' });

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

/**
 * Health endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mcp-amazon-ads',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Amazon Ads MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol server for Amazon Advertising API',
    endpoints: {
      health: '/health',
      mcp: '/mcp'
    },
    tools: [
      'get_profiles',
      'get_campaigns',
      'get_ad_groups',
      'get_keywords',
      'get_product_ads',
      'get_reports',
      'healthcheck'
    ]
  });
});

/**
 * MCP JSON-RPC endpoint
 */
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, method, params, id } = req.body;

    logger.debug(`Received MCP request: ${method}`);

    // Handle initialize method
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'mcp-amazon-ads',
            version: '1.0.0'
          }
        }
      });
    }

    // Handle tools/list method
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'get_profiles',
              description: 'Retrieve all Amazon Ads profiles across marketplaces',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id']
                  }
                },
                required: ['user_credentials']
              }
            },
            {
              name: 'get_campaigns',
              description: 'Fetch advertising campaigns with status and budget information',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' },
                      profile_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id', 'profile_id']
                  },
                  campaign_type: { type: 'string', enum: ['sp', 'sb', 'sd'], default: 'sp' },
                  filters: { type: 'object' },
                  paging: { type: 'object' }
                },
                required: ['user_credentials']
              }
            },
            {
              name: 'get_ad_groups',
              description: 'Retrieve ad groups with targeting and bid settings',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' },
                      profile_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id', 'profile_id']
                  },
                  campaign_type: { type: 'string' },
                  filters: { type: 'object' },
                  paging: { type: 'object' }
                },
                required: ['user_credentials']
              }
            },
            {
              name: 'get_keywords',
              description: 'Fetch keywords with bids and match types for Sponsored Products',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' },
                      profile_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id', 'profile_id']
                  },
                  filters: { type: 'object' },
                  paging: { type: 'object' }
                },
                required: ['user_credentials']
              }
            },
            {
              name: 'get_product_ads',
              description: 'List product ads with ASIN/SKU information',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' },
                      profile_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id', 'profile_id']
                  },
                  filters: { type: 'object' },
                  paging: { type: 'object' }
                },
                required: ['user_credentials']
              }
            },
            {
              name: 'get_reports',
              description: 'Generate and retrieve performance reports with metrics (ACOS, ROAS, CTR, etc.)',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' },
                      profile_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id', 'profile_id']
                  },
                  report_type: { type: 'string' },
                  campaign_type: { type: 'string' },
                  date_range: {
                    type: 'object',
                    properties: {
                      start_date: { type: 'string' },
                      end_date: { type: 'string' }
                    },
                    required: ['start_date', 'end_date']
                  },
                  metrics: { type: 'array' },
                  filters: { type: 'object' },
                  time_unit: { type: 'string' }
                },
                required: ['user_credentials', 'date_range']
              }
            },
            {
              name: 'healthcheck',
              description: 'Check Amazon Ads MCP server health and API connectivity',
              inputSchema: {
                type: 'object',
                properties: {
                  user_credentials: {
                    type: 'object',
                    properties: {
                      access_token: { type: 'string' },
                      client_id: { type: 'string' }
                    },
                    required: ['access_token', 'client_id']
                  }
                },
                required: ['user_credentials']
              }
            }
          ]
        }
      });
    }

    // Handle tools/call method
    if (method === 'tools/call') {
      const { name, arguments: args } = params;

      try {
        // Create Amazon Ads client from user credentials
        const client = createAmazonAdsClientFromRequest(args.user_credentials);

        let result;

        // Route to appropriate tool handler
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
            throw new Error(`Unknown tool: ${name}`);
        }

        logger.info(`Tool ${name} executed successfully`);

        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });
      } catch (toolError: any) {
        logger.error(`Tool ${name} failed`, toolError);

        return res.json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: toolError.message || 'Tool execution failed',
            data: {
              type: toolError.type || 'INTERNAL',
              upstream_code: toolError.upstream_code
            }
          }
        });
      }
    }

    // Unknown method
    return res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });
  } catch (error: any) {
    logger.error('MCP request failed', error);

    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32603,
        message: error.message || 'Internal server error'
      }
    });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  logger.info(`Amazon Ads MCP server listening on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
