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
npm install unified-report-generator
```

## Getting Started

Follow these steps to get started with Unified Report Generator:

### Step 1: Install the Package

```bash
npm install unified-report-generator
```

### Step 2: Create Configuration File

Create a `config.js` file in your project root. You can start by copying the example:

```bash
# Copy the example config (if you have it)
cp config.example.js config.js

# Or create a new config.js file manually
```

**Important**: Add `config.js` to your `.gitignore` file to prevent committing sensitive data:

```bash
echo "config.js" >> .gitignore
```

### Step 3: Set Up Environment Variables (Recommended)

Create a `.env` file in your project root for sensitive configuration:

```bash
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_RESOURCE_GROUP=your_resource_group
AZURE_LOAD_TEST_RESOURCE=your_load_test_resource
AZURE_LOAD_TEST_DATA_PLANE_URI=your_data_plane_uri
```

**Security**: Add `.env` to your `.gitignore` as well:

```bash
echo ".env" >> .gitignore
```

The package automatically loads environment variables from `.env` files using `dotenv`.

### Step 4: Configure Your Settings

Edit `config.js` and customize it for your project:

```javascript
export default {
  features: {
    automation: true,  // Set to false if you don't have Playwright results
    aiAnalysis: true,  // Set to false if you don't want AI analysis
  },
  ai: {
    apiKey: process.env.GEMINI_API_KEY || '',  // Loads from .env file
    model: 'gemini-2.5-pro',
  },
  azure: {
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
    loadTestResource: process.env.AZURE_LOAD_TEST_RESOURCE || '',
    loadTestDataPlaneUri: process.env.AZURE_LOAD_TEST_DATA_PLANE_URI || '',
    appComponents: [
      // Add your Azure resources here
    ],
  },
  outputDir: '.artifacts/unified-report',  // Where reports will be generated
  paths: {
    jmeterCsvPath: 'jmeter',  // Path to your JMeter CSV files
    playwrightReportPath: 'playwright-report',  // Path to Playwright reports
    azureDataPath: 'unified-report/azure',  // Path to Azure data
  },
};
```

**See `config.example.js` for a complete example with all available options.**

### Step 5: Prepare Your Test Data

Ensure your test artifacts are in the expected locations:

- **JMeter CSV**: Place your JMeter results CSV file in `.artifacts/jmeter/`
- **Playwright Reports**: Place Playwright reports in `.artifacts/playwright-report/` (if automation is enabled)
- **Azure Data**: Azure metrics can be fetched automatically, or place data in `.artifacts/unified-report/azure/`

You can customize these paths in `config.paths` if your structure is different.

### Step 6: Generate Your First Report

Run the report generator:

```bash
# Basic usage (uses config.js in current directory)
npx unified-report

# Or with custom config file
npx unified-report --config ./config.js

# Or with custom output directory
npx unified-report --output ./my-reports

# Or specify artifacts directory
npx unified-report --artifacts ./.artifacts
```

The report will be generated at `.artifacts/unified-report/index.html` (or your custom output directory).

### Step 7: View Your Report

Open the generated report:

```bash
# On macOS
open .artifacts/unified-report/index.html

# On Linux
xdg-open .artifacts/unified-report/index.html

# On Windows
start .artifacts/unified-report/index.html
```

Or use the standalone option for a single-file report:

```bash
npx unified-report --standalone
# Generates: .artifacts/unified-report/unified-report-standalone.html
```

### Next Steps

- **Customize User Types**: Update `userTypes` in config to match your JMeter thread groups
- **Configure Azure Resources**: Add your Azure resources to `appComponents` array
- **Enable/Disable Features**: Toggle `automation` and `aiAnalysis` in config based on your needs
- **Add to CI/CD**: Integrate report generation into your pipeline scripts

## Quick Start (Summary)

For experienced users, here's the minimal setup:

```bash
# 1. Install
npm install unified-report-generator

# 2. Create config.js (see config.example.js)

# 3. Create .env with your credentials

# 4. Generate report
npx unified-report
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

## Configuration Details

### Required vs Optional Settings

**Minimum required for basic report:**
- None! The package will work with just JMeter CSV files using default settings.

**Recommended for full functionality:**
- `config.js` file with your paths configured
- Azure configuration (if you want Azure metrics)
- AI API key (if you want AI analysis)

**For Azure metrics fetching:**
- Azure CLI installed and authenticated (`az login`)
- Azure configuration in `config.js` or environment variables

### Configuration File Structure

Your `config.js` should export a default object. See `config.example.js` for the complete structure with all available options.

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
import { generateUnifiedReport, generateStandaloneUnifiedReport, loadConfiguration } from 'unified-report-generator';

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

### Package Not Found After Installation

```bash
# Make sure you're using npx to run the CLI
npx unified-report

# Or add to your package.json scripts:
{
  "scripts": {
    "report": "unified-report"
  }
}
```

### Config File Not Found

- Ensure `config.js` exists in your project root (or current working directory)
- Or specify the path explicitly: `npx unified-report --config /path/to/config.js`
- Check that the file exports a default object: `export default { ... }`

### Environment Variables Not Loading

- Ensure you have a `.env` file in your project root
- The package automatically loads `.env` files using `dotenv`
- Verify environment variable names match exactly (case-sensitive)
- Check that values don't have extra spaces or quotes

### AI Analysis Not Working

- Check that `features.aiAnalysis` is `true` in config
- Verify `ai.apiKey` is set or `GEMINI_API_KEY` env var is available
- Check model name is valid (e.g., `'gemini-2.5-pro'`)
- Test your API key: `echo $GEMINI_API_KEY` (should show your key)

### Azure Metrics Not Fetching

- Verify all Azure configuration values are set in `config.js` or `.env`
- Ensure Azure CLI is installed: `az --version`
- Authenticate with Azure: `az login`
- Check that `appComponents` array is properly configured
- Verify Azure resource IDs are correct
- The package will automatically fetch the latest test run if `testRunId` is not provided

### Automation Sections Missing

- Check that `features.automation` is `true` in config
- Verify Playwright test results exist in the configured path (default: `.artifacts/playwright-report/`)
- Check that `--no-automation` flag is not set
- Update `paths.playwrightReportPath` in config if your reports are elsewhere

### JMeter CSV Not Found

- Check that JMeter CSV files are in the configured path (default: `.artifacts/jmeter/`)
- Update `paths.jmeterCsvPath` in config if your CSV files are elsewhere
- Verify the CSV file is from a recent JMeter test run

### Report Generation Errors

- Check that output directory is writable
- Verify you have read permissions for artifact directories
- Check console output for specific error messages
- Ensure all required files (JMeter CSV, etc.) exist before generating report

## Development

For contributors and developers working on the package itself:

### Project Structure

```
unified-report-generator/
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

See the [GitHub repository](https://github.com/SachinSuresh010/unified-report-generator) for development setup instructions.

## License

ISC

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.
