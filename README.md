# Unified Report Generator

A unified performance report generator that combines JMeter load test results, Playwright UI test results, and Azure server metrics into a single, navigable HTML dashboard.

## Features

- **Multi-Source Integration**: Combines JMeter, Playwright, and Azure metrics
- **Configurable Features**: Enable/disable automation and AI analysis sections
- **Standalone Reports**: Generate self-contained HTML reports
- **Azure Integration**: Configurable Azure metrics fetching
- **AI Analysis**: Optional AI-powered insights using Google Gemini

## Installation

```bash
npm install @edwise/unified-report-generator
```

### From GitHub (development)

```bash
npm install git+https://github.com/YOUR_USERNAME/unified-report-generator.git
```

### From Local Package

```bash
cd packages/unified-report-generator
npm install
npm link  # Optional: link for global usage
```

## Quick Start

1. **Create a configuration file** (`config.js`):

```javascript
export default {
  features: {
    automation: true,
    aiAnalysis: true,
  },
  ai: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-pro',
  },
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
    loadTestResource: process.env.AZURE_LOAD_TEST_RESOURCE || '',
    loadTestDataPlaneUri: process.env.AZURE_LOAD_TEST_DATA_PLANE_URI || '',
    appComponents: [
      // Your Azure resources here
    ],
  },
};
```

2. **Generate a report**:

```bash
# Using the CLI
unified-report

# Or using Node.js
import { generateUnifiedReport } from '@edwise/unified-report-generator';
await generateUnifiedReport({ config });
```

## Configuration

### Configuration File

Create a `config.js` file in your project root. See `config.example.js` for a complete example.

### Output Directory

- `outputDir`: Default output directory for generated reports (default: `.artifacts/unified-report`)
  - Can be relative to current working directory or absolute path
  - CLI `--output` flag overrides this setting

### Feature Flags

- `features.automation`: Enable/disable Playwright automation sections (default: `true`)
- `features.aiAnalysis`: Enable/disable AI analysis generation (default: `true`)

### AI Configuration

- `ai.apiKey`: Google Gemini API key (can also use `GEMINI_API_KEY` env var)
- `ai.model`: Primary model to use (default: `'gemini-2.5-pro'`)
- `ai.fallbackModels`: Array of fallback models if primary fails

### Azure Configuration

All Azure details should be configured in `config.azure`:

- `subscriptionId`: Azure subscription ID
- `resourceGroup`: Azure resource group
- `loadTestResource`: Azure Load Testing resource name
- `loadTestDataPlaneUri`: Azure Load Testing data plane URI
- `appComponents`: Array of Azure resources to monitor

**Important**: Never hard-code Azure credentials or sensitive information. Use environment variables or secure configuration management.

## CLI Usage

```bash
unified-report [options]
```

### Options

- `--config, -c <path>`: Path to configuration file (default: `config.js` in current directory)
- `--standalone, -s`: Generate standalone HTML report (all data embedded)
- `--no-automation`: Disable Playwright/automation sections (overrides config)
- `--enable-automation`: Enable Playwright/automation sections (overrides config)
- `--no-ai-analysis`: Disable AI analysis (overrides config)
- `--enable-ai-analysis`: Enable AI analysis (overrides config)
- `--output, -o <dir>`: Output directory (overrides `config.outputDir`, default: `.artifacts/unified-report`)
- `--help, -h`: Show help message

### Examples

```bash
# Generate standard report
unified-report

# Generate standalone report
unified-report --standalone

# Use custom config and disable automation
unified-report --config ./my-config.js --no-automation

# Custom output directory with AI analysis enabled (CLI override)
unified-report --output ./reports --enable-ai-analysis

# Using config file for default output directory
# In config.js: outputDir: './reports'
unified-report  # Will use ./reports from config
```

## Programmatic Usage

```javascript
import { generateUnifiedReport, generateStandaloneUnifiedReport, loadConfiguration } from '@edwise/unified-report-generator';

// Load configuration
const config = await loadConfiguration('./config.js');

// Generate standard report
await generateUnifiedReport({
  config,
  outputDir: './reports',  // Optional
  artifactsDir: './.artifacts',  // Optional
});

// Generate standalone report
await generateStandaloneUnifiedReport({
  config,
  outputDir: './reports',
});
```

## Output Structure

The generator creates the following structure:

```
.artifacts/
└── unified-report/
    ├── index.html              # Master dashboard
    ├── unified-report-standalone.html  # Standalone report (if --standalone)
    ├── jmeter/
    │   ├── summary.html
    │   └── transactions/
    │       └── *.html
    ├── playwright/             # Only if automation enabled
    │   └── summary.html
    ├── azure/
    │   └── summary.html
    └── ai-analysis/            # Only if AI analysis enabled
        └── summary.html
```

## Security Best Practices

1. **Never commit `config.js`** - Add it to `.gitignore`
2. **Use environment variables** for sensitive data:
   ```javascript
   apiKey: process.env.GEMINI_API_KEY || '',
   subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
   ```
3. **Use `config.example.js`** as a template without real values
4. **Rotate credentials** regularly
5. **Limit access** to configuration files

## Environment Variables

The following environment variables are supported:

- `GEMINI_API_KEY`: Google Gemini API key for AI analysis
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Azure resource group
- `AZURE_LOAD_TEST_RESOURCE`: Azure Load Testing resource name
- `AZURE_LOAD_TEST_DATA_PLANE_URI`: Azure Load Testing data plane URI

## Troubleshooting

### AI Analysis Not Working

- Check that `features.aiAnalysis` is `true` in config
- Verify `ai.apiKey` is set or `GEMINI_API_KEY` env var is available
- Check model name is valid (e.g., `'gemini-2.5-pro'`)

### Azure Metrics Not Fetching

- Verify all Azure configuration values are set
- Ensure Azure CLI is installed and authenticated (`az login`)
- Check that `appComponents` array is properly configured
- Verify Azure resource IDs are correct

### Automation Sections Missing

- Check that `features.automation` is `true` in config
- Verify Playwright test results exist in `.artifacts/performance-reports`
- Check that `--no-automation` flag is not set

## Development

### Project Structure

```
packages/unified-report-generator/
├── bin/
│   └── cli.js                 # CLI entry point
├── src/
│   ├── generateUnifiedReport.js
│   ├── fetchAzureMetrics.js
│   ├── generateAIAnalysis.js
│   └── config/
│       ├── defaultConfig.js
│       └── configLoader.js
├── config.example.js          # Example configuration
├── package.json
├── index.js                   # Main entry point
└── README.md
```

### Building

```bash
npm install
```

### Testing

```bash
# Test with sample data
unified-report --config config.example.js
```

## License

ISC

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
