/**
 * Default Configuration for Unified Report Generator
 */

const defaultConfig = {
  features: {
    automation: true,  // Enable/disable Playwright automation sections
    aiAnalysis: true,  // Enable/disable AI analysis generation
  },
  ai: {
    apiKey: '',  // Google Gemini API key (can be set via config or GEMINI_API_KEY env var)
    model: 'gemini-2.5-pro',  // Primary model to use
    fallbackModels: ['gemini-1.5-pro', 'gemini-pro'],  // Fallback models if primary fails
  },
  azure: {
    subscriptionId: '',  // Azure subscription ID
    resourceGroup: '',  // Azure resource group
    loadTestResource: '',  // Azure Load Testing resource name
    loadTestDataPlaneUri: '',  // Azure Load Testing data plane URI
    apiVersion: '2024-12-01-preview',  // Azure API version
    appComponents: [],  // Array of Azure resources to monitor
  },
  jmxFile: {
    path: null,  // Path to JMeter JMX file (relative to project root). Set to null to disable.
  },
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
    {
      key: 'gtAdmins',
      displayName: 'GT Admins',
      threadGroupPatterns: ['GT Admin', 'District GT Admin'],
      jmxThreadGroupNames: [],
    },
    {
      key: 'stateAdmins',
      displayName: 'State Admins',
      threadGroupPatterns: ['State Admin', 'SEA'],
      jmxThreadGroupNames: [],
    },
  ],
  environment: {
    urlPattern: 'app-gifted-(?:ui-)?(\\w+)\\.azurewebsites\\.net',
  },
  threadCounting: {
    rampUpWindowMs: 10000,
    executionGapMs: 30000,
  },
  // Output directory configuration
  outputDir: '.artifacts/unified-report',  // Default output directory (relative to current working directory or absolute)
  
  // Paths configuration - all paths are relative to artifactsDir unless absolute
  paths: {
    // JMeter CSV file path (relative to artifactsDir or absolute)
    // The package will look for CSV files in this directory
    jmeterCsvPath: 'jmeter',  // Default: artifactsDir/jmeter/
    // Alternative locations to check (if jmeterCsvPath doesn't exist)
    jmeterCsvAlternatives: ['unified-report/jmeter', 'jmeter'],
    
    // Playwright UI report path (relative to artifactsDir or absolute)
    playwrightReportPath: 'playwright-report',  // Default: artifactsDir/playwright-report/
    
    // Playwright performance reports path (relative to artifactsDir or absolute)
    playwrightPerformanceReportsPath: 'performance-reports',  // Default: artifactsDir/performance-reports/
    
    // Playwright consolidated reports path (relative to artifactsDir or absolute)
    playwrightConsolidatedReportsPath: 'unified-report/playwright-reports',  // Default: artifactsDir/unified-report/playwright-reports/
    
    // Azure Load Test data path (relative to artifactsDir or absolute)
    // The package will look for Azure data (CSV, dashboard, metrics JSON) in this directory
    azureDataPath: 'unified-report/azure',  // Default: artifactsDir/unified-report/azure/
    // Alternative locations to check (if azureDataPath doesn't exist)
    azureDataAlternatives: ['azure', 'unified-report/azure'],
  },
};

// Export both named and default for compatibility
export { defaultConfig };
export default defaultConfig;
