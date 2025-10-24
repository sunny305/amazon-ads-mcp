# Amazon Ads MCP Server

Model Context Protocol (MCP) server for Amazon Advertising API integration. This server provides tools to query Amazon Ads data including campaigns, keywords, product ads, and performance reports.

## Features

- **Multiple Campaign Types**: Sponsored Products (SP), Sponsored Brands (SB), Sponsored Display (SD)
- **Comprehensive Reporting**: ACOS, ROAS, CTR, CPC, and more
- **Profile Management**: Support for multiple advertising profiles/marketplaces
- **Async Report Generation**: Handles Amazon's asynchronous reporting API
- **Full Tool Suite**: 7 MCP tools for complete Amazon Ads data access

## Tools

### 1. get_profiles
Retrieve all Amazon Ads profiles across marketplaces.

**Required Credentials:**
- `access_token`
- `client_id`

### 2. get_campaigns
Fetch advertising campaigns with status and budget information.

**Required Credentials:**
- `access_token`
- `client_id`
- `profile_id`

**Parameters:**
- `campaign_type`: "sp" | "sb" | "sd" (default: "sp")
- `filters`: Optional filters (state, name, campaign_id_filter)
- `paging`: Pagination options

### 3. get_ad_groups
Retrieve ad groups with targeting and bid settings.

### 4. get_keywords
Fetch keywords with bids and match types for Sponsored Products.

### 5. get_product_ads
List product ads with ASIN/SKU information.

### 6. get_reports
Generate performance reports with metrics (ACOS, ROAS, CTR, CPC, sales, etc.).

**Parameters:**
- `date_range`: Required start_date and end_date (YYYYMMDD format)
- `report_type`: "campaigns" | "adGroups" | "keywords" | "productAds"
- `campaign_type`: "sp" | "sb" | "sd"
- `time_unit`: "SUMMARY" | "DAILY"

### 7. healthcheck
Check server health and Amazon API connectivity.

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
AMAZON_ADS_CLIENT_ID=amzn1.application-oa2-client.xxxxx
NODE_ENV=development
PORT=3002
```

## Development

```bash
# Run in development mode with hot reload
npm run dev:server

# Build TypeScript
npm run build

# Run compiled version
npm start:server
```

## Testing

```bash
# Health check
curl http://localhost:3002/health

# List tools
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

## Deployment

### Render Deployment

1. Push code to GitHub
2. Create new Web Service on Render
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:server`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `AMAZON_ADS_CLIENT_ID=your_client_id`

## Amazon Advertising API

### Authentication
Uses Login with Amazon (LwA) OAuth 2.0. The backend OAuth implementation is already complete.

### Required Headers
- `Authorization: Bearer {access_token}`
- `Amazon-Advertising-API-ClientId: {client_id}`
- `Amazon-Advertising-API-Scope: {profile_id}` (for most operations)

### Date Format
Amazon uses YYYYMMDD format (e.g., "20250124" for January 24, 2025)

### Key Metrics
- **ACOS**: Advertising Cost of Sales (spend/sales) - lower is better
- **ROAS**: Return on Ad Spend (sales/spend) - higher is better
- **CTR**: Click-Through Rate
- **CPC**: Cost Per Click

## Integration with n8n

The MCP server is designed to integrate with n8n workflows:

1. Deploy MCP server to Render
2. Add Amazon Ads Agent to n8n workflow
3. Configure MCP node with server URL
4. Backend sends credentials (access_token, client_id, profile_id) to n8n
5. n8n passes credentials to Amazon Ads Agent
6. Agent calls MCP tools with credentials

## Project Structure

```
mcp-amazon-ads/
├── src/
│   ├── adapters/       # API adapters
│   ├── tools/          # MCP tool handlers
│   ├── utils/          # Utilities
│   ├── client.ts       # Amazon Ads API client
│   ├── index.ts        # Stdio transport
│   └── server.ts       # HTTP JSON-RPC server
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC

## Support

For issues related to Amazon Advertising API, refer to:
- [Amazon Advertising API Docs](https://advertising.amazon.com/API/docs/en-us)
- [Login with Amazon OAuth](https://developer.amazon.com/docs/login-with-amazon/conceptual-overview.html)
# amazon-ads-mcp
