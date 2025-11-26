/**
 * Example Configuration File for Unified Report Generator
 * 
 * Copy this file to config.js and update with your settings.
 * Make sure to add config.js to .gitignore to keep sensitive data secure.
 */

export default {
  features: {
    automation: true,  // Set to false to disable all Playwright/automation sections
    aiAnalysis: true,  // Set to false to disable AI analysis generation
  },
  ai: {
    // API key can be provided here or via GEMINI_API_KEY environment variable
    apiKey: process.env.GEMINI_API_KEY || '',
    // Model to use for AI analysis
    model: 'gemini-2.5-pro',  // Options: 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-pro'
    // Optional: fallback models if primary model fails
    fallbackModels: ['gemini-1.5-pro', 'gemini-pro'],
  },
  azure: {
    // Azure configuration - all values can be provided here or via environment variables
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
    loadTestResource: process.env.AZURE_LOAD_TEST_RESOURCE || '',
    loadTestDataPlaneUri: process.env.AZURE_LOAD_TEST_DATA_PLANE_URI || '',
    apiVersion: '2024-12-01-preview',
    // Array of Azure resources to monitor
    appComponents: [
      {
        resourceId: '/subscriptions/YOUR_SUBSCRIPTION_ID/resourcegroups/YOUR_RESOURCE_GROUP/providers/microsoft.web/serverfarms/YOUR_APP_SERVICE_PLAN',
        metrics: ['CpuPercentage', 'MemoryPercentage'],
        name: 'App Service Plan',
      },
      {
        resourceId: '/subscriptions/YOUR_SUBSCRIPTION_ID/resourcegroups/YOUR_RESOURCE_GROUP/providers/microsoft.web/sites/YOUR_APP_SERVICE',
        metrics: ['Requests', 'Http5xx', 'HttpResponseTime'],
        name: 'Your App Service',
      },
      // Add more components as needed
    ],
  },
  // JMeter configuration
  jmxFile: {
    path: 'PerformanceTesting/SCDE-Flow.jmx',  // Path relative to project root, or null to disable
  },
  // User type configuration for JMeter analysis
  userTypes: [
    {
      key: 'districtCoordinators',
      displayName: 'District Coordinators',
      threadGroupPatterns: ['District Coordinator'],
      jmxThreadGroupNames: [],
    },
    {
      key: 'schoolUsers',
      displayName: 'School Users',
      threadGroupPatterns: ['School User'],
      jmxThreadGroupNames: [],
    },
    // Add more user types as needed
  ],
  // Environment configuration
  environment: {
    urlPattern: 'app-gifted-(?:ui-)?(\\w+)\\.azurewebsites\\.net',
  },
  // Thread counting configuration
  threadCounting: {
    rampUpWindowMs: 10000,
    executionGapMs: 30000,
  },
  // Output directory configuration
  // Default directory where unified reports will be generated
  // Can be relative to current working directory or absolute path
  // CLI --output flag will override this setting
  outputDir: '.artifacts/unified-report',  // Default: .artifacts/unified-report
  
  // Paths configuration - all paths are relative to artifactsDir unless absolute
  // You can customize these if your test data is stored in different locations
  paths: {
    // JMeter CSV file path (relative to artifactsDir or absolute)
    // The package will look for CSV files in this directory
    jmeterCsvPath: 'jmeter',  // Default: artifactsDir/jmeter/
    // Alternative locations to check if jmeterCsvPath doesn't exist
    // The package will try these in order until it finds CSV files
    jmeterCsvAlternatives: ['unified-report/jmeter', 'jmeter'],
    
    // Playwright UI report path (relative to artifactsDir or absolute)
    // Path to the main Playwright HTML report (index.html)
    playwrightReportPath: 'playwright-report',  // Default: artifactsDir/playwright-report/
    
    // Playwright performance reports path (relative to artifactsDir or absolute)
    // Path to performance-specific reports
    playwrightPerformanceReportsPath: 'performance-reports',  // Default: artifactsDir/performance-reports/
    
    // Playwright consolidated reports path (relative to artifactsDir or absolute)
    // Path to consolidated/aggregated Playwright reports
    playwrightConsolidatedReportsPath: 'unified-report/playwright-reports',  // Default: artifactsDir/unified-report/playwright-reports/
    
    // Azure Load Test data path (relative to artifactsDir or absolute)
    // The package will look for Azure data (CSV, dashboard, metrics JSON) in this directory
    azureDataPath: 'unified-report/azure',  // Default: artifactsDir/unified-report/azure/
    // Alternative locations to check if azureDataPath doesn't exist
    // The package will try these in order until it finds Azure data
    azureDataAlternatives: ['azure', 'unified-report/azure'],
  },
};
