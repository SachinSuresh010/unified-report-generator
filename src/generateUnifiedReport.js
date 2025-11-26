/**
 * Unified Performance Report Generator
 *
 * Combines Playwright UI tests, JMeter load tests, and Azure Load Test results
 * into a single, navigable HTML dashboard.
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.config - Configuration object
 * @param {string} options.outputDir - Output directory (defaults to .artifacts/unified-report)
 * @param {string} options.artifactsDir - Artifacts directory (defaults to .artifacts)
 * @returns {Promise<boolean>} Success status
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateAIAnalysis } from './generateAIAnalysis.js';
import { fetchAzureMetrics } from './fetchAzureMetrics.js';

// Get current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Note: This is a large file. The full implementation would include all helper functions
// from the original file. For now, this provides the main structure and entry points.
// The full implementation would need to be completed by copying and refactoring
// all helper functions from the original generateUnifiedReport.js

/**
 * Main entry point for generating unified report
 * @param {Object} options - Configuration options
 * @param {Object} options.config - Configuration object
 * @param {string} options.outputDir - Output directory
 * @param {string} options.artifactsDir - Artifacts directory
 * @returns {Promise<boolean>} Success status
 */
export async function generateUnifiedReport(options = {}) {
    const { config, outputDir, artifactsDir } = options;
    
    if (!config) {
        throw new Error('Configuration object is required');
    }

    // Set up directories
    const baseArtifactsDir = artifactsDir || path.join(process.cwd(), '.artifacts');
    const baseOutputDir = outputDir || path.join(baseArtifactsDir, 'unified-report');
    const playwrightReportsDir = path.join(baseArtifactsDir, 'performance-reports');
    
    const jmeterDir = path.join(baseOutputDir, 'jmeter');
    const playwrightDir = path.join(baseOutputDir, 'playwright');
    const azureDir = path.join(baseOutputDir, 'azure');
    const aiAnalysisDir = path.join(baseOutputDir, 'ai-analysis');

    // Output files
    const masterDashboard = path.join(baseOutputDir, 'index.html');
    const playwrightSummary = path.join(playwrightDir, 'summary.html');
    const jmeterSummary = path.join(jmeterDir, 'summary.html');
    const azureSummary = path.join(azureDir, 'summary.html');
    const aiAnalysisSummary = path.join(aiAnalysisDir, 'summary.html');

    console.log('🚀 Starting Unified Performance Report Generation...\n');

    try {
        // Step 1: Create directory structure
        console.log('📁 Creating directory structure...');
        createDirectories(baseOutputDir, jmeterDir, playwrightDir, azureDir, aiAnalysisDir, config);

        // Step 2: Parse JMeter results
        console.log('📊 Parsing JMeter results...');
        const jmeterData = parseJMeterResults(baseArtifactsDir, baseOutputDir, config);

        // Step 3: Parse Playwright results (only if automation is enabled)
        let playwrightData = null;
        if (config.features && config.features.automation) {
            console.log('🎭 Parsing Playwright results...');
            playwrightData = parsePlaywrightResults(baseArtifactsDir, baseOutputDir, config);
        } else {
            console.log('⏭️  Skipping Playwright results (automation disabled)');
        }

        // Step 4: Get Azure Load Test info
        console.log('☁️  Processing Azure Load Test info...');
        const azureData = await getAzureLoadTestInfo(azureDir, config, baseArtifactsDir);

        // Step 5: Generate section summaries
        console.log('📝 Generating section summaries...');
        generateJMeterSummary(jmeterData, jmeterDir, jmeterSummary, config);
        
        if (config.features && config.features.automation && playwrightData) {
            generatePlaywrightSummary(playwrightData, playwrightDir, playwrightSummary);
        }
        
        generateAzureSummary(azureData, jmeterData, azureDir, azureSummary, config);

        // Step 6: Generate transaction detail pages
        if (jmeterData && jmeterData.transactions) {
            console.log('🔍 Generating transaction detail pages...');
            generateTransactionDetails(jmeterData.transactions, jmeterDir);
        }

        // Step 7: Generate AI analysis (only if enabled)
        let aiAnalysis = null;
        if (config.features && config.features.aiAnalysis) {
            console.log('🤖 Generating AI analysis...');
            aiAnalysis = await generateAIAnalysis(jmeterData, playwrightData, azureData, config);
            generateAIAnalysisSummary(aiAnalysis, aiAnalysisDir, aiAnalysisSummary);
        } else {
            console.log('⏭️  Skipping AI analysis (disabled in configuration)');
        }

        // Step 8: Generate master dashboard
        console.log('🎨 Generating master dashboard...');
        generateMasterDashboard(jmeterData, playwrightData, azureData, aiAnalysis, masterDashboard, config);

        console.log('\n✅ Unified Performance Report generated successfully!');
        console.log(`📄 Report location: ${masterDashboard}\n`);

        return true;
    } catch (error) {
        console.error('\n❌ Error generating unified report:', error);
        console.error(error.stack);
        return false;
    }
}

/**
 * Generate standalone unified report
 * @param {Object} options - Configuration options
 * @param {Object} options.config - Configuration object
 * @param {string} options.outputDir - Output directory
 * @param {string} options.artifactsDir - Artifacts directory
 * @returns {Promise<boolean>} Success status
 */
export async function generateStandaloneUnifiedReport(options = {}) {
    const { config, outputDir, artifactsDir } = options;
    
    if (!config) {
        throw new Error('Configuration object is required');
    }

    // Set up directories
    const baseArtifactsDir = artifactsDir || path.join(process.cwd(), '.artifacts');
    const baseOutputDir = outputDir || path.join(baseArtifactsDir, 'unified-report');
    const playwrightReportsDir = path.join(baseArtifactsDir, 'performance-reports');
    
    const jmeterDir = path.join(baseOutputDir, 'jmeter');
    const playwrightDir = path.join(baseOutputDir, 'playwright');
    const azureDir = path.join(baseOutputDir, 'azure');
    const aiAnalysisDir = path.join(baseOutputDir, 'ai-analysis');

    console.log('🚀 Starting Standalone Unified Report Generation...\n');

    try {
        // Step 1: Create directory structure
        console.log('📁 Creating directory structure...');
        createDirectories(baseOutputDir, jmeterDir, playwrightDir, azureDir, aiAnalysisDir, config);

        // Step 2: Parse all data
        console.log('📊 Parsing JMeter results...');
        const jmeterData = parseJMeterResults(baseArtifactsDir, baseOutputDir, config);

        let playwrightData = null;
        if (config.features && config.features.automation) {
            console.log('🎭 Parsing Playwright results...');
            playwrightData = parsePlaywrightResults(baseArtifactsDir, baseOutputDir, config);
        } else {
            console.log('⏭️  Skipping Playwright results (automation disabled)');
        }

        console.log('☁️  Processing Azure Load Test info...');
        const azureData = await getAzureLoadTestInfo(azureDir, config, baseArtifactsDir);

        // Step 3: Generate AI analysis (only if enabled)
        let aiAnalysis = null;
        if (config.features && config.features.aiAnalysis) {
            console.log('🤖 Generating AI analysis...');
            aiAnalysis = await generateAIAnalysis(jmeterData, playwrightData, azureData, config);
        } else {
            console.log('⏭️  Skipping AI analysis (disabled in configuration)');
        }

        // Step 4: Generate standalone HTML
        console.log('📝 Generating standalone HTML file...');
        const standaloneHTML = generateStandaloneHTML(jmeterData, playwrightData, azureData, aiAnalysis, config);

        // Step 5: Write to file
        const outputPath = path.join(baseOutputDir, 'unified-report-standalone.html');
        fs.writeFileSync(outputPath, standaloneHTML, 'utf-8');

        console.log('\n✅ Standalone Unified Report generated successfully!');
        console.log(`📄 Report location: ${outputPath}`);
        console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB\n`);

        return true;
    } catch (error) {
        console.error('\n❌ Error generating standalone unified report:', error);
        console.error(error.stack);
        return false;
    }
}

/**
 * Create directory structure
 */
function createDirectories(baseOutputDir, jmeterDir, playwrightDir, azureDir, aiAnalysisDir, config) {
    const dirs = [baseOutputDir, jmeterDir, path.join(jmeterDir, 'transactions')];
    
    // Only create Playwright directory if automation is enabled
    if (config.features && config.features.automation) {
        dirs.push(playwrightDir);
    }
    
    dirs.push(azureDir);
    
    // Only create AI analysis directory if AI analysis is enabled
    if (config.features && config.features.aiAnalysis) {
        dirs.push(aiAnalysisDir);
    }

    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get common styles for all HTML pages
 */
function getCommonStyles() {
    return `<style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 0px;
            color: #333;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            transition: transform 0.2s;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        .card.success-card {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border-left: 4px solid #0cce6b;
        }

        .card.warning-card {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #ffa400;
        }

        .card.error-card {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            border-left: 4px solid #ff4e42;
        }

        .card h3 {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .subsection {
            margin-bottom: 20px;
        }

        .card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }

        .card .sub-value {
            font-size: 0.85em;
            color: #888;
            margin-top: 5px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .table-container {
            overflow-x: auto;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }

        td {
            padding: 12px 15px;
            border-bottom: 1px solid #f0f0f0;
        }

        tbody tr:hover {
            background-color: #f8f9fa;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        .metric-value {
            font-weight: 600;
            color: #667eea;
        }

        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9em;
        }

        .empty-state {
            text-align: center;
            padding: 60px 40px;
            color: #999;
            font-style: italic;
            font-size: 1.1em;
        }

        .btn-back {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 10px;
        }

        .btn-back:hover {
            background: #5568d3;
        }

        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.2s;
            margin-top: 15px;
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .btn-secondary {
            display: inline-block;
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }

        .btn-secondary:hover {
            background: #5a6268;
            color: white;
        }

        .btn-azure {
            display: inline-block;
            background: #0078d4;
            color: white;
            padding: 14px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1em;
            transition: background 0.2s;
        }

        .btn-azure:hover {
            background: #005a9e;
        }

        .report-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .report-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }

        .report-card h3 {
            margin-bottom: 10px;
            color: #333;
        }

        .report-card p {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .azure-portal-card {
            background: #f0f6ff;
            padding: 30px;
            border-radius: 10px;
            border-left: 4px solid #0078d4;
            text-align: center;
        }

        .azure-portal-card p {
            margin: 15px 0;
            color: #666;
        }

        .azure-portal-card .note {
            font-size: 0.85em;
            color: #999;
        }

        .metrics-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .metric-info-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .metric-info-card h4 {
            margin-bottom: 10px;
            color: #333;
        }

        .metric-info-card p {
            color: #666;
            font-size: 0.9em;
            line-height: 1.5;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
            .card:hover {
                transform: none;
            }
        }
    </style>`;
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Utility: Sanitize filename
 */
function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Utility: Format bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract user configuration and environment from thread names and URLs
 */
function extractUserConfiguration(allSamples, threadGroupMap = null, reportConfig = null) {
    // Initialize config with all user types from configuration
    const config = {
        environment: 'Unknown',
    };

    // Initialize counts for all configured user types
    if (reportConfig && reportConfig.userTypes) {
        reportConfig.userTypes.forEach((userType) => {
            config[userType.key] = 0;
        });
    } else {
        // Fallback to default user types if no config provided
        config.districtCoordinators = 0;
        config.schoolUsers = 0;
        config.gtAdmins = 0;
        config.stateAdmins = 0;
    }

    if (allSamples.length === 0) {
        return config;
    }

    // Get thread counting parameters from config
    const rampUpWindowMs = reportConfig?.threadCounting?.rampUpWindowMs || 10000;
    const executionGapMs = reportConfig?.threadCounting?.executionGapMs || 30000;

    // Helper function to count distinct thread instances for a given user type
    // Uses JMX thread group mappings if available, otherwise falls back to pattern matching
    const countThreadInstances = (userTypeConfig, threadGroupNames = null) => {
        let matchingSamples = [];

        if (threadGroupNames && threadGroupNames.length > 0) {
            // Use JMX thread group names for exact matching (most reliable)
            matchingSamples = allSamples.filter((s) => {
                if (!s.threadName) return false;
                return threadGroupNames.some((groupName) => s.threadName.includes(groupName));
            });
        } else {
            // Fallback to pattern matching using configured patterns
            const patterns = userTypeConfig.threadGroupPatterns || [userTypeConfig.displayName];
            matchingSamples = allSamples.filter((s) => {
                if (!s.threadName) return false;
                return patterns.some((pattern) => s.threadName.includes(pattern));
            });
        }

        if (matchingSamples.length === 0) return 0;

        // Get all unique thread names
        const threadNames = matchingSamples.map((s) => s.threadName);
        const uniqueThreadNames = new Set(threadNames);

        // If we have multiple thread groups for this user type, we need to count threads per group and sum them
        // Group threads by their thread group name (the part before the thread number)
        const threadsByGroup = new Map();

        uniqueThreadNames.forEach((threadName) => {
            // Extract the thread group name (everything before the last number pattern)
            // Patterns: "ThreadGroupName ThreadGroupNum-ThreadNum" or "ThreadGroupName-ThreadNum"
            const groupMatch = threadName.match(/^(.+?)\s*\d+-\d+$/);
            if (groupMatch) {
                const groupName = groupMatch[1].trim();
                if (!threadsByGroup.has(groupName)) {
                    threadsByGroup.set(groupName, new Set());
                }
                threadsByGroup.get(groupName).add(threadName);
            } else {
                // Fallback: use the full thread name as the group
                if (!threadsByGroup.has(threadName)) {
                    threadsByGroup.set(threadName, new Set());
                }
                threadsByGroup.get(threadName).add(threadName);
            }
        });

        // If we have multiple thread groups, count threads per group and sum them
        if (threadsByGroup.size > 1) {
            let totalCount = 0;
            threadsByGroup.forEach((threads, groupName) => {
                // Count distinct threads in this group
                const threadNumbers = Array.from(threads)
                    .map((name) => {
                        // Extract thread number from patterns like "GroupName 3-1" or "GroupName-1"
                        const dashNumberMatch = name.match(/-(\d+)$/);
                        if (dashNumberMatch) {
                            return parseInt(dashNumberMatch[1], 10);
                        }
                        const spaceNumberMatch = name.match(/\s+(\d+)$/);
                        if (spaceNumberMatch) {
                            return parseInt(spaceNumberMatch[1], 10);
                        }
                        return null;
                    })
                    .filter((num) => num !== null);

                if (threadNumbers.length > 0) {
                    // Use max number from this group
                    totalCount += Math.max(...threadNumbers);
                } else {
                    // Fallback: count unique thread names in this group
                    totalCount += threads.size;
                }
            });
            return totalCount;
        }

        // Single thread group - use the original logic
        const numbers = Array.from(uniqueThreadNames)
            .map((name) => {
                // Look for JMeter's standard pattern "ThreadGroupName-ThreadNumber" (e.g., "End-to-End-GT Admin-1")
                const dashNumberMatch = name.match(/-(\d+)$/);
                if (dashNumberMatch) {
                    return parseInt(dashNumberMatch[1], 10);
                }
                // Also try pattern with space (e.g., "GT Admin 1")
                const spaceNumberMatch = name.match(/\s+(\d+)$/);
                if (spaceNumberMatch) {
                    return parseInt(spaceNumberMatch[1], 10);
                }
                return null;
            })
            .filter((num) => num !== null);

        if (numbers.length > 0) {
            // If we found numbers in thread names, return the maximum
            return Math.max(...numbers);
        }

        // If no numbers found, count distinct thread instances
        // Group samples by threadName
        // Note: uniqueThreadNames already defined above, reuse it

        // If we have multiple unique thread names, count them
        if (uniqueThreadNames.size > 1) {
            return uniqueThreadNames.size;
        }

        // All threads have the same name - need to count distinct instances
        // Identify distinct thread instances by finding the first sample from each execution
        const samples = matchingSamples;
        if (samples.length === 0) return 0;

        // Sort samples by timestamp
        samples.sort((a, b) => a.timestamp - b.timestamp);

        // Find the first sample from each thread instance
        // A new thread instance starts when there's a significant gap in timestamps
        const RAMP_UP_WINDOW_MS = rampUpWindowMs;
        const EXECUTION_GAP_MS = executionGapMs;

        const firstSampleTimestamps = [];
        let lastTimestamp = 0;

        samples.forEach((sample) => {
            // If this is the first sample or there's a significant gap, it's likely a new thread instance
            if (firstSampleTimestamps.length === 0 || sample.timestamp - lastTimestamp > EXECUTION_GAP_MS) {
                firstSampleTimestamps.push(sample.timestamp);
            }
            lastTimestamp = sample.timestamp;
        });

        // Group first samples by time windows to handle threads starting at similar times during ramp-up
        const timeWindows = new Set();
        firstSampleTimestamps.forEach((ts) => {
            // Round to nearest time window to group threads starting around the same time
            const windowKey = Math.floor(ts / RAMP_UP_WINDOW_MS);
            timeWindows.add(windowKey);
        });

        // Return the count of distinct time windows (distinct thread instances)
        // Ensure we return at least 1 if we have samples
        return Math.max(timeWindows.size, uniqueThreadNames.size, 1);
    };

    // Count each user type - use JMX thread group mappings if available
    if (reportConfig && reportConfig.userTypes) {
        reportConfig.userTypes.forEach((userType) => {
            const threadGroupNames = threadGroupMap ? threadGroupMap[userType.key] : null;
            config[userType.key] = countThreadInstances(userType, threadGroupNames);
        });
    } else {
        // Fallback to default user types if no config provided
        const defaultUserTypes = [
            { key: 'districtCoordinators', displayName: 'District Coordinators', threadGroupPatterns: ['District Coordinator'] },
            { key: 'schoolUsers', displayName: 'School Users', threadGroupPatterns: ['School User'] },
            { key: 'gtAdmins', displayName: 'GT Admins', threadGroupPatterns: ['GT Admin', 'District GT Admin'] },
            { key: 'stateAdmins', displayName: 'State Admins', threadGroupPatterns: ['State Admin', 'SEA'] },
        ];
        defaultUserTypes.forEach((userType) => {
            const threadGroupNames = threadGroupMap ? threadGroupMap[userType.key] : null;
            config[userType.key] = countThreadInstances(userType, threadGroupNames);
        });
    }

    // Extract environment from URLs using configured pattern
        const urlPattern = reportConfig?.environment?.urlPattern || 'app-(?:ui-)?(\\w+)\\.azurewebsites\\.net';
    const envRegex = new RegExp(urlPattern);

    for (const sample of allSamples) {
        if (sample.url && sample.url.includes('azurewebsites.net')) {
            const envMatch = sample.url.match(envRegex);
            if (envMatch && envMatch[1]) {
                config.environment = envMatch[1].toUpperCase();
                break;
            }
        }
    }

    return config;
}

/**
 * Analyze errors - group by type and find top errors by sampler
 */
function analyzeErrors(errors) {
    if (errors.length === 0) {
        return {
            hasErrors: false,
            totalErrors: 0,
            errorsByType: {},
            topErrorsBySampler: [],
        };
    }

    // Group errors by response code
    const errorsByType = {};
    const errorsBySampler = {};

    errors.forEach((error) => {
        const errorType = error.responseCode || 'Unknown';
        const sampler = error.label;

        // Group by error type
        if (!errorsByType[errorType]) {
            errorsByType[errorType] = {
                code: errorType,
                count: 0,
                message: error.responseMessage || 'No message',
            };
        }
        errorsByType[errorType].count++;

        // Group by sampler
        if (!errorsBySampler[sampler]) {
            errorsBySampler[sampler] = {
                sampler: sampler,
                count: 0,
                errorType: errorType,
                message: error.failureMessage || error.responseMessage || '',
            };
        }
        errorsBySampler[sampler].count++;
    });

    // Get top 5 errors by sampler (most frequent)
    const topErrorsBySampler = Object.values(errorsBySampler)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        hasErrors: true,
        totalErrors: errors.length,
        errorsByType,
        topErrorsBySampler,
    };
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

/**
 * Calculate statistics for a set of values
 */
function calculateStatistics(values) {
    if (values.length === 0) {
        return { min: 0, max: 0, avg: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = values.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sum / sorted.length),
        p90: percentile(sorted, 90),
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
    };
}

/**
 * Calculate percentile
 */
function percentile(sortedArray, p) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
}

/**
 * Resolve a path from config (can be relative to artifactsDir or absolute)
 */
function resolvePath(configPath, artifactsDir) {
    if (!configPath) return null;
    // If it's an absolute path, return as-is
    if (path.isAbsolute(configPath)) {
        return configPath;
    }
    // Otherwise, resolve relative to artifactsDir
    return path.join(artifactsDir, configPath);
}

/**
 * Find JMeter CSV file using config paths
 */
function findJMeterCSV(artifactsDir, config) {
    const pathsToTry = [];
    
    // Add primary path from config
    if (config.paths && config.paths.jmeterCsvPath) {
        const primaryPath = resolvePath(config.paths.jmeterCsvPath, artifactsDir);
        if (primaryPath) pathsToTry.push(primaryPath);
    }
    
    // Add alternative paths from config
    if (config.paths && config.paths.jmeterCsvAlternatives && Array.isArray(config.paths.jmeterCsvAlternatives)) {
        config.paths.jmeterCsvAlternatives.forEach(altPath => {
            const resolvedPath = resolvePath(altPath, artifactsDir);
            if (resolvedPath && !pathsToTry.includes(resolvedPath)) {
                pathsToTry.push(resolvedPath);
            }
        });
    }
    
    // Try each path until we find CSV files
    for (const dirPath of pathsToTry) {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            const csvFiles = files.filter((f) => f.toLowerCase().endsWith('.csv'));
            
            if (csvFiles.length > 0) {
                return {
                    csvPath: path.join(dirPath, csvFiles[0]),
                    directory: dirPath,
                };
            }
        }
    }
    
    return null;
}

/**
 * Parse JMX file to extract thread group configurations
 * Returns a map of user type keys to thread group names
 */
function parseJMXThreadGroups(config) {
    if (!config.jmxFile || !config.jmxFile.path) {
        return null;
    }

    // Try multiple path resolutions:
    // 1. Relative to current working directory
    // 2. Relative to project root (go up from Playwright directory)
    // 3. Relative to script location
    let jmxPath = path.join(process.cwd(), config.jmxFile.path);

    if (!fs.existsSync(jmxPath)) {
        // Try from project root (assuming we're in AutomationTest/Playwright)
        const projectRoot = path.resolve(__dirname, '../../..');
        jmxPath = path.join(projectRoot, config.jmxFile.path);
    }

    if (!fs.existsSync(jmxPath)) {
        // Try relative to script directory
        jmxPath = path.join(__dirname, '..', '..', '..', config.jmxFile.path);
    }

    if (!fs.existsSync(jmxPath)) {
        console.warn(`   ⚠️  JMX file not found: ${jmxPath}`);
        console.warn('   Using fallback thread name matching');
        return null;
    }

    try {
        const jmxContent = fs.readFileSync(jmxPath, 'utf-8');
        const threadGroupMap = {};

        // Initialize map with empty arrays for each user type
        config.userTypes.forEach((userType) => {
            threadGroupMap[userType.key] = [];
        });

        // Extract thread group names using regex
        // Match: <ThreadGroup ... testname="Thread Group Name">
        const threadGroupRegex = /<ThreadGroup[^>]*testname="([^"]+)"/g;
        let match;

        while ((match = threadGroupRegex.exec(jmxContent)) !== null) {
            const threadGroupName = match[1];

            // Map thread group names to user types based on configuration
            config.userTypes.forEach((userType) => {
                // Check if this thread group name matches any of the configured patterns
                const matchesJmxName = userType.jmxThreadGroupNames.some((pattern) => threadGroupName.includes(pattern));

                if (matchesJmxName) {
                    threadGroupMap[userType.key].push(threadGroupName);
                }
            });
        }

        return threadGroupMap;
    } catch (error) {
        console.warn(`   ⚠️  Error parsing JMX file: ${error.message}`);
        return null;
    }
}

// ============================================================================
// CORE PARSING FUNCTIONS
// ============================================================================

function parseJMeterResults(artifactsDir, outputDir, config) {
    try {
        // Look for JMeter CSV file using config paths
        const csvResult = findJMeterCSV(artifactsDir, config);
        if (!csvResult || !csvResult.csvPath) {
            console.warn('⚠️  No JMeter CSV file found');
            if (config.paths && config.paths.jmeterCsvPath) {
                console.warn(`   Checked path: ${config.paths.jmeterCsvPath}`);
            }
            if (config.paths && config.paths.jmeterCsvAlternatives) {
                console.warn(`   Checked alternatives: ${config.paths.jmeterCsvAlternatives.join(', ')}`);
            }
            return null;
        }

        const jmeterCSVPath = csvResult.csvPath;
        const jmeterDir = path.join(outputDir, 'jmeter');
        
        console.log(`   Found JMeter CSV: ${path.basename(jmeterCSVPath)}`);
        console.log(`   Source directory: ${csvResult.directory}`);

        const csvContent = fs.readFileSync(jmeterCSVPath, 'utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
            console.warn('⚠️  JMeter CSV is empty');
            return null;
        }

        // Parse CSV header
        const headers = parseCSVLine(lines[0]);
        const labelIndex = headers.indexOf('label');
        const elapsedIndex = headers.indexOf('elapsed');
        const successIndex = headers.indexOf('success');
        const responseCodeIndex = headers.indexOf('responseCode');
        const responseMessageIndex = headers.indexOf('responseMessage');
        const dataTypeIndex = headers.indexOf('dataType');
        const latencyIndex = headers.indexOf('Latency');
        const connectIndex = headers.indexOf('Connect');
        const bytesIndex = headers.indexOf('bytes');
        const urlIndex = headers.indexOf('URL');

        if (labelIndex === -1 || elapsedIndex === -1) {
            console.warn('⚠️  Invalid JMeter CSV format');
            return null;
        }

        // Parse all samples - capture both Transaction Controllers and their child requests
        const samples = [];
        const transactions = {};
        const allSamples = []; // All samples including individual requests for error analysis
        const errors = [];
        const threadGroupIndex = headers.indexOf('threadName');
        const failureMessageIndex = headers.indexOf('failureMessage');
        const timestampIndex = headers.indexOf('timeStamp');
        let minTimestamp = Infinity;
        let maxTimestamp = 0;
        let totalSuccessCount = 0;
        let totalErrorCount = 0;
        let currentTransaction = null; // Track current transaction for grouping child requests
        let currentTransactionExecutionIndex = -1; // Track which execution we're on for the current transaction
        let expectedChildRequestCount = 0; // Track expected number of child requests for current transaction
        let collectedChildRequestCount = 0; // Track how many child requests we've collected for current execution

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length > Math.max(labelIndex, elapsedIndex)) {
                const timestamp = parseInt(values[timestampIndex]) || 0;
                const sample = {
                    label: values[labelIndex] || '',
                    elapsed: parseInt(values[elapsedIndex]) || 0,
                    success: values[successIndex] === 'true',
                    responseCode: values[responseCodeIndex] || '',
                    responseMessage: values[responseMessageIndex] || '',
                    dataType: values[dataTypeIndex] || '',
                    threadName: values[threadGroupIndex] || '',
                    failureMessage: values[failureMessageIndex] || '',
                    latency: parseInt(values[latencyIndex]) || 0,
                    connect: parseInt(values[connectIndex]) || 0,
                    bytes: parseInt(values[bytesIndex]) || 0,
                    url: values[urlIndex] || '',
                    timestamp: timestamp,
                };

                allSamples.push(sample);

                // Track min/max timestamps for duration calculation
                if (timestamp > 0) {
                    minTimestamp = Math.min(minTimestamp, timestamp);
                    maxTimestamp = Math.max(maxTimestamp, timestamp + sample.elapsed);
                }

                // Track errors (individual HTTP requests only, not transaction controllers)
                // Track errors from actual HTTP requests:
                // - Must have dataType (individual request) OR have a URL (individual request)
                // - Must NOT be a transaction controller (dataType === '' AND responseMessage contains "Number of samples")
                const isTransactionController = sample.dataType === '' && sample.responseMessage && sample.responseMessage.includes('Number of samples in transaction');
                const isIndividualRequest = sample.dataType !== '' || (sample.url && sample.url !== 'null' && sample.url !== '');

                if (!sample.success && isIndividualRequest && !isTransactionController) {
                    errors.push({
                        label: sample.label,
                        responseCode: sample.responseCode,
                        responseMessage: sample.responseMessage,
                        failureMessage: sample.failureMessage,
                    });
                    totalErrorCount++;
                } else if (sample.success) {
                    totalSuccessCount++;
                }

                // Check if this is a Transaction Controller
                if (sample.dataType === '' && sample.responseMessage.includes('Number of samples in transaction')) {
                    samples.push(sample);

                    // Parse expected child request count from responseMessage
                    // Format: "Number of samples in transaction : 2, number of failing samples : 2"
                    const countMatch = sample.responseMessage.match(/Number of samples in transaction\s*:\s*(\d+)/);
                    const expectedCount = countMatch ? parseInt(countMatch[1]) : 0;

                    // Group by transaction name
                    const transactionName = sample.label;
                    if (!transactions[transactionName]) {
                        transactions[transactionName] = {
                            name: transactionName,
                            samples: [],
                            totalSamples: 0,
                            successCount: 0,
                            errorCount: 0,
                            childRequests: [], // Store individual API requests (flat array for backward compatibility)
                            childRequestsByExecution: [], // Store child requests grouped by execution index
                        };
                    }

                    const executionIndex = transactions[transactionName].samples.length;
                    transactions[transactionName].samples.push(sample);
                    transactions[transactionName].totalSamples++;
                    if (sample.success) {
                        transactions[transactionName].successCount++;
                    } else {
                        transactions[transactionName].errorCount++;
                    }

                    // Initialize child requests array for this execution
                    if (!transactions[transactionName].childRequestsByExecution[executionIndex]) {
                        transactions[transactionName].childRequestsByExecution[executionIndex] = [];
                    }

                    // Set as current transaction for child request grouping
                    currentTransaction = transactionName;
                    currentTransactionExecutionIndex = executionIndex;
                    expectedChildRequestCount = expectedCount;
                    collectedChildRequestCount = 0; // Reset counter for new execution
                } else if (currentTransaction && currentTransactionExecutionIndex >= 0) {
                    // Check if we've collected all expected child requests for this execution
                    if (collectedChildRequestCount >= expectedChildRequestCount) {
                        // Stop collecting child requests for this execution
                        currentTransaction = null;
                        currentTransactionExecutionIndex = -1;
                        expectedChildRequestCount = 0;
                        collectedChildRequestCount = 0;
                    }

                    // Check if this is a child request (individual sampler) of the current transaction
                    // Child requests have: dataType is not empty OR have a URL (some child requests have empty dataType but have URL)
                    // AND it's not a transaction controller
                    const isChildRequest =
                        (sample.dataType !== '' || (sample.url && sample.url !== 'null' && sample.url !== '')) &&
                        !(sample.dataType === '' && sample.responseMessage && sample.responseMessage.includes('Number of samples in transaction'));

                    if (isChildRequest && transactions[currentTransaction] && collectedChildRequestCount < expectedChildRequestCount) {
                        // Store in flat array for backward compatibility
                        transactions[currentTransaction].childRequests.push(sample);
                        // Store in execution-specific array for accurate matching
                        transactions[currentTransaction].childRequestsByExecution[currentTransactionExecutionIndex].push(sample);
                        collectedChildRequestCount++;
                    } else if (sample.dataType === '' && sample.responseMessage && sample.responseMessage.includes('Number of samples in transaction')) {
                        // This is a new transaction controller, reset current transaction tracking
                        currentTransaction = null;
                        currentTransactionExecutionIndex = -1;
                        expectedChildRequestCount = 0;
                        collectedChildRequestCount = 0;
                    }
                }
            }
        }

        console.log(`   Parsed ${samples.length} transaction controllers`);

        // Calculate statistics for each transaction
        Object.values(transactions).forEach((transaction) => {
            const responseTimes = transaction.samples.map((s) => s.elapsed);
            transaction.stats = calculateStatistics(responseTimes);
            transaction.errorRate = ((transaction.errorCount / transaction.totalSamples) * 100).toFixed(2);

            // Remove duplicate child requests and get unique samplers
            const uniqueChildRequests = [];
            const seenLabels = new Set();
            transaction.childRequests.forEach((req) => {
                if (!seenLabels.has(req.label)) {
                    seenLabels.add(req.label);
                    uniqueChildRequests.push(req);
                }
            });
            transaction.uniqueChildRequests = uniqueChildRequests;
        });

        console.log(`   Identified ${Object.keys(transactions).length} unique transactions`);

        // Log child requests for debugging
        const totalChildRequests = Object.values(transactions).reduce((sum, t) => sum + t.uniqueChildRequests.length, 0);
        console.log(`   Captured ${totalChildRequests} unique API samplers across all transactions`);

        // Calculate actual test duration from timestamps
        const testDurationMs = maxTimestamp - minTimestamp;
        const testDurationSec = Math.round(testDurationMs / 1000);
        const minutes = Math.floor(testDurationSec / 60);
        const seconds = testDurationSec % 60;
        console.log(`   Test duration: ${minutes}m ${seconds}s (${testDurationSec}s total)`);

        // Format start and end times
        const startTime = new Date(minTimestamp);
        const endTime = new Date(maxTimestamp);
        const formatTime = (date) => {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            });
        };

        // Get timezone abbreviation from a timestamp
        const getTimezoneAbbr = (timestamp) => {
            const date = new Date(timestamp);
            try {
                // Get the system's timezone
                const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                // Format the date to get timezone abbreviation
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZoneName: 'short',
                    timeZone: systemTimeZone,
                });

                const parts = formatter.formatToParts(date);
                const timeZoneName = parts.find((part) => part.type === 'timeZoneName')?.value;

                if (timeZoneName) {
                    return timeZoneName;
                }
            } catch (e) {
                // Fall through to offset-based detection
            }

            // Fallback: determine from UTC offset
            const offsetMinutes = date.getTimezoneOffset();
            const offsetHours = -offsetMinutes / 60;

            // Common timezones
            if (offsetHours === 0) return 'UTC';
            if (offsetHours === -5) return 'EST';
            if (offsetHours === -4) return 'EDT';
            if (offsetHours === -6) return 'CST';
            if (offsetHours === -7) return 'MST';
            if (offsetHours === -8) return 'PST';

            // Generic offset format
            return `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
        };

        // Use config parameter instead of loadConfiguration()
        const reportConfig = config;

        // Parse JMX file to get thread group mappings (more reliable than pattern matching)
        const threadGroupMap = parseJMXThreadGroups(reportConfig);

        // Extract user configuration from thread names
        const userConfig = extractUserConfiguration(allSamples, threadGroupMap, reportConfig);

        // Calculate pass percentage
        const totalRequestCount = totalSuccessCount + totalErrorCount;
        const passPercentage = totalRequestCount > 0 ? ((totalSuccessCount / totalRequestCount) * 100).toFixed(2) : 100;

        // Analyze errors - group by type and find top errors
        const errorAnalysis = analyzeErrors(errors);

        console.log(`   Success rate: ${passPercentage}% (${totalSuccessCount}/${totalRequestCount} requests)`);
        if (totalErrorCount > 0) {
            console.log(`   Total errors: ${totalErrorCount}`);
        }

        // Get timezone abbreviation
        const timezone = getTimezoneAbbr(minTimestamp);

        return {
            totalSamples: samples.length,
            samples,
            transactions,
            testDuration: testDurationSec,
            testDurationFormatted: `${minutes}m ${seconds}s`,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            startTimestamp: minTimestamp,
            endTimestamp: maxTimestamp,
            timezone: timezone,
            userConfig,
            passPercentage,
            totalRequests: totalRequestCount,
            totalSuccessCount,
            totalErrorCount,
            errorAnalysis,
        };
    } catch (error) {
        console.error('   Error parsing JMeter results:', error.message);
        return null;
    }
}

function parsePlaywrightResults(artifactsDir, outputDir, config) {
    try {
        // Get Playwright paths from config
        const playwrightReportPath = config.paths?.playwrightReportPath || 'playwright-report';
        const playwrightConsolidatedReportsPath = config.paths?.playwrightConsolidatedReportsPath || 'unified-report/playwright-reports';
        const playwrightPerformanceReportsPath = config.paths?.playwrightPerformanceReportsPath || 'performance-reports';

        // Resolve paths (can be relative to artifactsDir or absolute)
        const resolvedPlaywrightReportPath = resolvePath(playwrightReportPath, artifactsDir);
        const resolvedConsolidatedReportsPath = resolvePath(playwrightConsolidatedReportsPath, artifactsDir);
        const resolvedPerformanceReportsPath = resolvePath(playwrightPerformanceReportsPath, artifactsDir);

        // Check for playwright-reports in consolidated reports directory
        const playwrightReportsDir = resolvedConsolidatedReportsPath;

        // Also check for Playwright UI test report (index.html)
        const playwrightReportIndex = resolvedPlaywrightReportPath ? path.join(resolvedPlaywrightReportPath, 'index.html') : null;
        const hasPlaywrightUIReport = playwrightReportIndex && fs.existsSync(playwrightReportIndex);

        if (!fs.existsSync(playwrightReportsDir) && !hasPlaywrightUIReport) {
            console.warn('⚠️  Playwright reports directory not found');
            return null;
        }

        // Check for existing aggregate reports
        const consolidatedReport = fs.existsSync(playwrightReportsDir) ? path.join(playwrightReportsDir, 'consolidated-report.html') : null;
        const performanceReport = resolvedPerformanceReportsPath ? path.join(resolvedPerformanceReportsPath, 'playwright-performance', 'performance-report.html') : 
                                 (fs.existsSync(playwrightReportsDir) ? path.join(playwrightReportsDir, 'playwright-performance', 'performance-report.html') : null);

        // Calculate relative path from output/playwright/ to playwright-report/
        // Summary file is at outputDir/playwright/summary.html
        // Playwright report is at resolvedPlaywrightReportPath/index.html
        // Calculate relative path
        let playwrightUIReportPath = null;
        if (hasPlaywrightUIReport && resolvedPlaywrightReportPath) {
            const playwrightSummaryDir = path.join(outputDir, 'playwright');
            const relativePath = path.relative(playwrightSummaryDir, resolvedPlaywrightReportPath);
            playwrightUIReportPath = path.join(relativePath, 'index.html').replace(/\\/g, '/'); // Normalize for web paths
        }

        const data = {
            hasConsolidatedReport: consolidatedReport ? fs.existsSync(consolidatedReport) : false,
            hasPerformanceReport: performanceReport ? fs.existsSync(performanceReport) : false,
            hasPlaywrightUIReport: hasPlaywrightUIReport,
            playwrightUIReportPath: playwrightUIReportPath,
            testCount: 0,
            individualTests: [],
        };

        // Find all individual test HTML reports
        if (fs.existsSync(playwrightReportsDir)) {
            const files = fs.readdirSync(playwrightReportsDir);
            const htmlReports = files.filter((f) => f.endsWith('.html') && f !== 'consolidated-report.html' && !f.startsWith('.'));

            // Parse each HTML report to get test name and details
            htmlReports.forEach((filename) => {
                // Extract test name from filename (e.g., "external-referral-form---performance-2025-11-13.html")
                // Remove date patterns (---performance-YYYY-MM-DD or any date pattern) and .html extension
                let testName = filename
                    .replace(/\.html$/, '') // Remove .html extension first
                    .replace(/---performance-\d{4}-\d{2}-\d{2}$/, '') // Remove ---performance-YYYY-MM-DD
                    .replace(/-\d{4}-\d{2}-\d{2}$/, '') // Remove any remaining -YYYY-MM-DD pattern
                    .replace(/-/g, ' ') // Replace hyphens with spaces
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                // Check for corresponding JSON file
                const jsonFilename = filename.replace('.html', '.json');
                const jsonPath = path.join(playwrightReportsDir, jsonFilename);
                let metrics = null;
                let pageLoadTime = null;
                let actions = [];
                let status = 'unknown';

                if (fs.existsSync(jsonPath)) {
                    try {
                        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
                        metrics = JSON.parse(jsonContent);

                        // Extract page load time
                        if (metrics.navigationTiming && metrics.navigationTiming.totalTime) {
                            pageLoadTime = metrics.navigationTiming.totalTime;
                        } else if (metrics.webVitals && metrics.webVitals.LCP) {
                            pageLoadTime = metrics.webVitals.LCP;
                        }

                        // Extract actions
                        if (metrics.actionTimings && metrics.actionTimings.actions) {
                            actions = metrics.actionTimings.actions.map((action) => ({
                                name: action.name,
                                duration: action.duration,
                                timestamp: action.timestamp,
                            }));
                        }

                        // Determine status based on metrics
                        // If there are API failures, mark as failed
                        if (metrics.apiLogs && metrics.apiLogs.totalFailures > 0) {
                            status = 'failed';
                        } else if (metrics.webVitals) {
                            // Check if any web vitals are poor
                            const hasPoorVitals =
                                (metrics.webVitals.LCP && metrics.webVitals.LCP > 4000) ||
                                (metrics.webVitals.CLS && metrics.webVitals.CLS > 0.25) ||
                                (metrics.webVitals.FCP && metrics.webVitals.FCP > 3000);
                            status = hasPoorVitals ? 'warning' : 'passed';
                        } else {
                            status = 'passed';
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }

                data.individualTests.push({
                    filename,
                    testName,
                    metrics,
                    hasJson: fs.existsSync(jsonPath),
                    pageLoadTime,
                    actions,
                    status,
                });
            });

            data.testCount = htmlReports.length;
        }

        // Try to parse metrics from database-metrics.json if available
        // Check in performance reports path
        const metricsFile = resolvedPerformanceReportsPath ? path.join(resolvedPerformanceReportsPath, 'playwright-performance', 'database-metrics.json') : null;
        // Also check in consolidated reports path as fallback
        const metricsFileFallback = path.join(playwrightReportsDir, 'playwright-performance', 'database-metrics.json');
        
        const metricsFileToUse = (metricsFile && fs.existsSync(metricsFile)) ? metricsFile : 
                                 (fs.existsSync(metricsFileFallback) ? metricsFileFallback : null);
        
        if (metricsFileToUse) {
            try {
                const metrics = JSON.parse(fs.readFileSync(metricsFileToUse, 'utf-8'));
                data.databaseMetrics = metrics;
            } catch (e) {
                // Ignore parse errors
            }
        }

        console.log(`   Found ${data.testCount} individual Playwright test reports`);
        if (hasPlaywrightUIReport) {
            console.log(`   Found Playwright UI test report (index.html)`);
        }

        return data;
    } catch (error) {
        console.error('   Error parsing Playwright results:', error.message);
        return null;
    }
}

async function getAzureLoadTestInfo(azureDir, config, artifactsDir) {
    try {
        // Get Azure data path from config
        const azureDataPath = config.paths?.azureDataPath || 'unified-report/azure';
        const azureDataAlternatives = config.paths?.azureDataAlternatives || ['azure', 'unified-report/azure'];
        
        // Resolve primary path
        const resolvedAzureDataPath = resolvePath(azureDataPath, artifactsDir);
        
        // Build list of paths to try
        const pathsToTry = [];
        if (resolvedAzureDataPath) {
            pathsToTry.push(resolvedAzureDataPath);
        }
        
        // Add alternative paths
        azureDataAlternatives.forEach(altPath => {
            const resolvedPath = resolvePath(altPath, artifactsDir);
            if (resolvedPath && !pathsToTry.includes(resolvedPath)) {
                pathsToTry.push(resolvedPath);
            }
        });
        
        // Also try output directory as fallback
        if (!pathsToTry.includes(azureDir)) {
            pathsToTry.push(azureDir);
        }
        
        // Find the first path that contains Azure data
        let actualAzureDir = azureDir;
        for (const dir of pathsToTry) {
            if (fs.existsSync(dir) && (fs.existsSync(path.join(dir, 'azure-server-metrics.json')) || fs.existsSync(path.join(dir, 'dashboard')) || fs.existsSync(path.join(dir, 'results.zip')) || fs.existsSync(path.join(dir, 'report.zip')))) {
                actualAzureDir = dir;
                console.log(`   Found Azure data in: ${dir}`);
                break;
            }
        }
        
        // Build base Azure Load Test portal URL from config
        // Format: https://portal.azure.com/#view/Microsoft_Azure_CloudNativeTesting/NewTestRun.ReactView/resourceId/%2Fsubscriptions%2F{subscriptionId}%2Fresourcegroups%2F{resourceGroup}%2Fproviders%2Fmicrosoft.loadtestservice%2Floadtests%2F{loadTestResource}
        let basePortalUrl = null;
        if (config.azure && config.azure.subscriptionId && config.azure.resourceGroup && config.azure.loadTestResource) {
            const subscriptionId = encodeURIComponent(config.azure.subscriptionId);
            const resourceGroup = encodeURIComponent(config.azure.resourceGroup);
            const loadTestResource = encodeURIComponent(config.azure.loadTestResource);
            basePortalUrl = `https://portal.azure.com/#view/Microsoft_Azure_CloudNativeTesting/NewTestRun.ReactView/resourceId/%2Fsubscriptions%2F${subscriptionId}%2Fresourcegroups%2F${resourceGroup}%2Fproviders%2Fmicrosoft.loadtestservice%2Floadtests%2F${loadTestResource}`;
        }

        // Check for Azure Load Test CSV in the azure directory
        let hasResults = false;
        let totalRequests = 0;
        let avgCpuPercent = 'N/A';
        let avgMemoryPercent = 'N/A';
        let testRunId = null;

        if (fs.existsSync(actualAzureDir)) {
            const files = fs.readdirSync(actualAzureDir);
            hasResults = files.some((f) => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.zip'));

            // Extract zip files if they exist
            const resultsZip = path.join(actualAzureDir, 'results.zip');
            if (fs.existsSync(resultsZip)) {
                try {
                    console.log('   Extracting results.zip...');
                    const { execSync } = require('child_process');
                    execSync(`unzip -o "${resultsZip}" -d "${actualAzureDir}"`, { stdio: 'ignore' });
                } catch (e) {
                    // Already extracted or error, continue
                }
            }

            // Extract report.zip to get Azure dashboard and metadata
            const reportZip = path.join(actualAzureDir, 'report.zip');
            if (fs.existsSync(reportZip)) {
                try {
                    console.log('   Extracting Azure dashboard from report.zip...');
                    const { execSync } = require('child_process');
                    const dashboardDir = path.join(actualAzureDir, 'dashboard');
                    if (!fs.existsSync(dashboardDir)) {
                        fs.mkdirSync(dashboardDir, { recursive: true });
                    }
                    execSync(`unzip -o "${reportZip}" -d "${dashboardDir}"`, { stdio: 'ignore' });
                    console.log('   ✓ Azure dashboard extracted');
                } catch (e) {
                    // Already extracted or error, continue
                }
            }

            // Try to extract testRunId from testRunData.js (in dashboard/data/)
            const testRunDataPath = path.join(actualAzureDir, 'dashboard', 'data', 'testRunData.js');
            if (fs.existsSync(testRunDataPath)) {
                try {
                    const content = fs.readFileSync(testRunDataPath, 'utf-8');
                    // Parse testRunName (this is the ID used in portal URLs, not testRunId!)
                    // "testRunName": "99c67ad2-b598-46fe-a413-9890b4b78d54"
                    const match = content.match(/"testRunName":\s*"([^"]+)"/);
                    if (match && match[1]) {
                        testRunId = match[1];
                        console.log(`   Extracted testRunName: ${testRunId}`);
                    }
                } catch (e) {
                    console.warn('   Could not parse testRunData.js:', e.message);
                }
            }

            // Fallback: Try to find testRunId from testRunId.txt file (from updated pipeline)
            if (!testRunId) {
                const testIdFile = files.find((f) => f.toLowerCase().includes('testid') || f.toLowerCase().includes('testrunid'));
                if (testIdFile) {
                    try {
                        const testIdPath = path.join(actualAzureDir, testIdFile);
                        const testIdContent = fs.readFileSync(testIdPath, 'utf-8').trim();
                        testRunId = testIdContent;
                        console.log(`   Extracted testRunId from file: ${testRunId}`);
                    } catch (e) {
                        // Ignore
                    }
                }
            }

            // Parse CSV if available for summary stats
            // Refresh files list after extraction
            const updatedFiles = fs.readdirSync(actualAzureDir);
            const csvFile = updatedFiles.find((f) => f.toLowerCase().endsWith('.csv'));
            if (csvFile) {
                const csvPath = path.join(actualAzureDir, csvFile);
                try {
                    const content = fs.readFileSync(csvPath, 'utf-8');
                    const lines = content.split('\n').filter((l) => l.trim());
                    totalRequests = Math.max(0, lines.length - 1); // Subtract header
                    hasResults = true;
                } catch (e) {
                    console.warn('   Could not parse Azure CSV:', e.message);
                }
            }
        }

        // Build portal URL with testRunId if available
        let portalUrl = basePortalUrl;
        if (testRunId && config.azure && config.azure.subscriptionId && config.azure.resourceGroup && config.azure.loadTestResource) {
            const subscriptionId = encodeURIComponent(config.azure.subscriptionId);
            const resourceGroup = encodeURIComponent(config.azure.resourceGroup);
            const loadTestResource = encodeURIComponent(config.azure.loadTestResource);
            portalUrl = `https://portal.azure.com/#view/Microsoft_Azure_CloudNativeTesting/TestRunReport.ReactView/resourceId/%2Fsubscriptions%2F${subscriptionId}%2Fresourcegroups%2F${resourceGroup}%2Fproviders%2Fmicrosoft.loadtestservice%2Floadtests%2F${loadTestResource}/testRunId/${testRunId}`;
        }

        // Check if Azure dashboard exists (index.html from report.zip in dashboard folder)
        const azureDashboardPath = path.join(actualAzureDir, 'dashboard', 'index.html');
        const hasAzureDashboard = fs.existsSync(azureDashboardPath);

        // Read server-side metrics JSON if available, or fetch dynamically
        let serverMetrics = null;
        const metricsFile = path.join(actualAzureDir, 'azure-server-metrics.json');
        if (fs.existsSync(metricsFile)) {
            try {
                const metricsContent = fs.readFileSync(metricsFile, 'utf-8');
                serverMetrics = JSON.parse(metricsContent);
                console.log('   ✓ Server-side metrics loaded from JSON');

                // Update CPU and Memory values from App Service Plan metrics if available
                if (serverMetrics?.serverMetrics?.appServicePlan) {
                    avgCpuPercent = serverMetrics.serverMetrics.appServicePlan.cpuPercentage?.avg || avgCpuPercent;
                    avgMemoryPercent = serverMetrics.serverMetrics.appServicePlan.memoryPercentage?.avg || avgMemoryPercent;
                }

                // NOTE: totalRequests should remain as client-side count from CSV
                // Do NOT overwrite with server-side metrics!
            } catch (e) {
                console.warn('   ⚠️  Could not parse server metrics JSON:', e.message);
            }
        } else if (testRunId && config.azure) {
            // Metrics file doesn't exist, but we have testRunId - try to fetch dynamically
            console.log('   📡 Server-side metrics not found. Attempting to fetch from Azure...');
            try {
                // Ensure directory exists
                if (!fs.existsSync(actualAzureDir)) {
                    fs.mkdirSync(actualAzureDir, { recursive: true });
                }
                
                const fetchedMetrics = await fetchAzureMetrics(testRunId, config);
                if (fetchedMetrics) {
                    serverMetrics = fetchedMetrics;
                    // Save fetched metrics to file for future use
                    fs.writeFileSync(metricsFile, JSON.stringify(fetchedMetrics, null, 2));
                    console.log('   ✅ Server-side metrics fetched and saved to azure-server-metrics.json');

                    // Update CPU and Memory values from App Service Plan metrics if available
                    if (serverMetrics?.serverMetrics?.appServicePlan) {
                        avgCpuPercent = serverMetrics.serverMetrics.appServicePlan.cpuPercentage?.avg || avgCpuPercent;
                        avgMemoryPercent = serverMetrics.serverMetrics.appServicePlan.memoryPercentage?.avg || avgMemoryPercent;
                    }
                } else {
                    console.warn('   ⚠️  Could not fetch metrics from Azure. Make sure you are authenticated (run: az login)');
                }
            } catch (error) {
                console.warn(`   ⚠️  Error fetching Azure metrics: ${error.message}`);
                console.warn('   💡 Tip: Run "az login" to authenticate with Azure');
            }
        } else if (config.azure?.testRunId) {
            // Use testRunId from config if not found in artifacts
            testRunId = config.azure.testRunId;
            console.log(`   Using testRunId from config: ${testRunId}`);
            console.log('   📡 Attempting to fetch metrics from Azure...');
            try {
                // Ensure directory exists
                if (!fs.existsSync(actualAzureDir)) {
                    fs.mkdirSync(actualAzureDir, { recursive: true });
                }
                
                const fetchedMetrics = await fetchAzureMetrics(testRunId, config);
                if (fetchedMetrics) {
                    serverMetrics = fetchedMetrics;
                    // Save fetched metrics to file for future use
                    fs.writeFileSync(metricsFile, JSON.stringify(fetchedMetrics, null, 2));
                    console.log('   ✅ Server-side metrics fetched and saved to azure-server-metrics.json');

                    // Update CPU and Memory values from App Service Plan metrics if available
                    if (serverMetrics?.serverMetrics?.appServicePlan) {
                        avgCpuPercent = serverMetrics.serverMetrics.appServicePlan.cpuPercentage?.avg || avgCpuPercent;
                        avgMemoryPercent = serverMetrics.serverMetrics.appServicePlan.memoryPercentage?.avg || avgMemoryPercent;
                    }
                } else {
                    console.warn('   ⚠️  Could not fetch metrics from Azure. Make sure you are authenticated (run: az login)');
                }
            } catch (error) {
                console.warn(`   ⚠️  Error fetching Azure metrics: ${error.message}`);
                console.warn('   💡 Tip: Run "az login" to authenticate with Azure');
            }
        }
        
        // Try to fetch latest test run if no metrics file and no testRunId
        if (!serverMetrics && config.azure && config.azure.subscriptionId && config.azure.loadTestDataPlaneUri) {
            // No testRunId found, but Azure config exists - try to fetch latest test run
            console.log('   📡 No testRunId found. Attempting to fetch latest test run from Azure...');
            try {
                // Ensure directory exists
                if (!fs.existsSync(actualAzureDir)) {
                    fs.mkdirSync(actualAzureDir, { recursive: true });
                }
                
                // Pass null to fetchAzureMetrics to trigger latest test run lookup
                const fetchedMetrics = await fetchAzureMetrics(null, config);
                if (fetchedMetrics) {
                    serverMetrics = fetchedMetrics;
                    // Extract testRunId from fetched metrics
                    if (fetchedMetrics.testRunId) {
                        testRunId = fetchedMetrics.testRunId;
                    }
                    // Save fetched metrics to file for future use
                    fs.writeFileSync(metricsFile, JSON.stringify(fetchedMetrics, null, 2));
                    console.log('   ✅ Server-side metrics fetched and saved to azure-server-metrics.json');

                    // Update CPU and Memory values from App Service Plan metrics if available
                    if (serverMetrics?.serverMetrics?.appServicePlan) {
                        avgCpuPercent = serverMetrics.serverMetrics.appServicePlan.cpuPercentage?.avg || avgCpuPercent;
                        avgMemoryPercent = serverMetrics.serverMetrics.appServicePlan.memoryPercentage?.avg || avgMemoryPercent;
                    }
                } else {
                    console.warn('   ⚠️  Could not fetch metrics from Azure.');
                    console.warn('   💡 Tip: Provide testRunId in config.azure.testRunId or ensure you have test runs in Azure');
                }
            } catch (error) {
                console.warn(`   ⚠️  Error fetching Azure metrics: ${error.message}`);
                console.warn('   💡 Tip: Run "az login" to authenticate with Azure');
            }
            }
        }

        console.log(`   Azure Load Test results: ${hasResults ? 'Found' : 'Not found'}`);
        if (testRunId) {
            console.log(`   Test Run ID: ${testRunId}`);
        }
        if (hasAzureDashboard) {
            console.log('   Azure dashboard: Found');
        }
        if (serverMetrics) {
            console.log('   Server-side metrics: Available');
        }

        return {
            portalUrl: portalUrl || 'N/A',
            hasResults,
            totalRequests,
            testRunId,
            hasAzureDashboard,
            serverMetrics,
            metrics: {
                cpuPercent: avgCpuPercent,
                memoryPercent: avgMemoryPercent,
            },
        };
    } catch (error) {
        console.error('   Error processing Azure Load Test info:', error.message);
        return null;
    }
}

/**
 * Generate JMeter summary page
 */
function generateJMeterSummary(jmeterData, jmeterDir, jmeterSummary, config) {
    if (!jmeterData || !jmeterData.transactions) {
        const html = generateEmptyJMeterSummary();
        fs.writeFileSync(jmeterSummary, html, 'utf-8');
        return;
    }

    const html = generateJMeterSummaryHTML(jmeterData);
    fs.writeFileSync(jmeterSummary, html, 'utf-8');
    console.log(`   ✓ JMeter summary generated`);
}

/**
 * Generate empty JMeter summary
 */
function generateEmptyJMeterSummary() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JMeter Summary - No Data</title>
    ${getCommonStyles()}
</head>
<body>
    <div class="container">
        <h1>📊 JMeter Load Test Summary</h1>
        <div class="empty-state">
            <p>No JMeter results available</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate JMeter summary HTML
 */
function generateJMeterSummaryHTML(jmeterData) {
    const transactions = Object.values(jmeterData.transactions);

    // Sort by total samples (most active transactions first)
    transactions.sort((a, b) => b.totalSamples - a.totalSamples);

    // Separate business transactions from setup/teardown
    const businessTransactions = transactions.filter((tx) => !tx.name.toLowerCase().includes('insert') && !tx.name.toLowerCase().includes('clean'));
    const setupTransactions = transactions.filter((tx) => tx.name.toLowerCase().includes('insert') || tx.name.toLowerCase().includes('clean'));

    const transactionRows = transactions
        .map((tx) => {
            const isSetup = tx.name.toLowerCase().includes('insert') || tx.name.toLowerCase().includes('clean');
            return `
        <tr class="transaction-row ${isSetup ? 'setup-transaction' : 'business-transaction'}">
            <td><strong>${escapeHtml(tx.name)}</strong></td>
            <td>${tx.totalSamples.toLocaleString()}</td>
            <td class="metric-value">${tx.stats.avg} ms</td>
            <td>${tx.stats.min} ms</td>
            <td>${tx.stats.max} ms</td>
            <td>${tx.stats.p90} ms</td>
            <td>${tx.stats.p95} ms</td>
            <td>${tx.stats.p99} ms</td>
            <td class="${tx.errorRate > 0 ? 'error-rate' : 'success-rate'}">${tx.errorRate}%</td>
            <td>
                <a href="transactions/${sanitizeFilename(tx.name)}.html" class="btn-details">View Details →</a>
            </td>
        </tr>
    `;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JMeter Load Test Summary</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    ${getCommonStyles()}
    <style>
        .transaction-row:hover {
            background: #f8f9fa;
            cursor: pointer;
        }
        .setup-transaction {
            display: none;
            background: #f9f9f9;
        }
        .setup-transaction.visible {
            display: table-row;
        }
        .btn-details {
            background: #667eea;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.85em;
            display: inline-block;
        }
        .btn-details:hover {
            background: #5568d3;
        }
        .error-rate {
            color: #ff4e42;
            font-weight: bold;
        }
        .success-rate {
            color: #0cce6b;
            font-weight: bold;
        }
        .chart-container {
            margin: 30px 0;
            height: 400px;
        }
        .toggle-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        .toggle-btn:hover {
            background: #5568d3;
        }
        .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 JMeter Load Test Summary</h1>
            <p>Transaction Performance Overview</p>
        </div>

        <div class="content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <h3>Total Samples</h3>
                    <div class="value">${jmeterData.totalSamples.toLocaleString()}</div>
                </div>
                <div class="card">
                    <h3>Business Transactions</h3>
                    <div class="value">${businessTransactions.length}</div>
                    <div class="sub-value">User workflows</div>
                </div>
                <div class="card">
                    <h3>Setup/Teardown</h3>
                    <div class="value">${setupTransactions.length}</div>
                    <div class="sub-value">Hidden by default</div>
                </div>
                <div class="card">
                    <h3>Test Duration</h3>
                    <div class="value">${jmeterData.testDurationFormatted || jmeterData.testDuration + 's'}</div>
                    <div class="sub-value">${jmeterData.testDuration} seconds total</div>
                </div>
            </div>

            <!-- Performance Chart -->
            <div class="section">
                <h2 class="section-title">Response Time Distribution</h2>
                <div class="chart-container">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>

            <!-- Transaction Table -->
            <div class="section">
                <h2 class="section-title">
                    Transaction Details
                    <div style="display: flex; gap: 10px;">
                        <button onclick="toggleSetupTransactions()" class="toggle-btn" id="setupToggleBtn" style="font-size: 0.75em;">
                            ☐ Show Setup/Teardown (${setupTransactions.length})
                        </button>
                    </div>
                </h2>
                <p style="color: #666; margin-bottom: 15px;">
                    Showing ${businessTransactions.length} business transactions. Setup/Teardown transactions (Insert, Clean Up) are hidden by default.
                </p>

                <!-- Filter Input -->
                <div style="margin-bottom: 20px;">
                    <input
                        type="text"
                        id="transactionFilter"
                        placeholder="🔍 Filter by transaction name..."
                        style="
                            width: 100%;
                            max-width: 500px;
                            padding: 12px 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 1em;
                            transition: border-color 0.2s;
                        "
                        onkeyup="filterTransactions()"
                        onfocus="this.style.borderColor='#667eea'"
                        onblur="this.style.borderColor='#e0e0e0'"
                    />
                    <span id="filterCount" style="margin-left: 15px; color: #666; font-size: 0.9em;"></span>
                </div>

                <div class="table-container">
                    <table id="transactionTable">
                        <thead>
                            <tr>
                                <th>Transaction Name</th>
                                <th>Samples</th>
                                <th>Avg Response Time</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>90th %ile</th>
                                <th>95th %ile</th>
                                <th>99th %ile</th>
                                <th>Error %</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactionTableBody">
                            ${transactionRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>

    <script>
        // Toggle setup/teardown transactions
        let setupTransactionsVisible = false;

        function toggleSetupTransactions() {
            setupTransactionsVisible = !setupTransactionsVisible;
            const setupRows = document.querySelectorAll('.setup-transaction');
            const btn = document.getElementById('setupToggleBtn');

            setupRows.forEach(row => {
                if (setupTransactionsVisible) {
                    row.classList.add('visible');
                } else {
                    row.classList.remove('visible');
                }
            });

            // Update button text
            if (setupTransactionsVisible) {
                btn.innerHTML = '☑️ Hide Setup/Teardown (${setupTransactions.length})';
            } else {
                btn.innerHTML = '☐ Show Setup/Teardown (${setupTransactions.length})';
            }

            // Reapply filter if active
            filterTransactions();
        }

        // Filter transactions by name
        function filterTransactions() {
            const input = document.getElementById('transactionFilter');
            const filter = input.value.toLowerCase();
            const tbody = document.getElementById('transactionTableBody');
            const rows = tbody.getElementsByTagName('tr');
            let visibleCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const transactionName = row.getElementsByTagName('td')[0];
                const isSetupRow = row.classList.contains('setup-transaction');

                if (transactionName) {
                    const txtValue = transactionName.textContent || transactionName.innerText;
                    const matchesFilter = txtValue.toLowerCase().indexOf(filter) > -1;
                    const shouldShow = matchesFilter && (!isSetupRow || setupTransactionsVisible);

                    if (shouldShow) {
                        if (isSetupRow) {
                            row.classList.add('visible');
                        }
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                }
            }

            // Update count display
            const filterCount = document.getElementById('filterCount');
            if (filter) {
                filterCount.textContent = \`Showing \${visibleCount} transactions\`;
            } else {
                filterCount.textContent = '';
            }
        }

        // Performance Chart
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(transactions.map((tx) => tx.name))},
                datasets: [
                    {
                        label: 'Avg Response Time (ms)',
                        data: ${JSON.stringify(transactions.map((tx) => tx.stats.avg))},
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '95th Percentile (ms)',
                        data: ${JSON.stringify(transactions.map((tx) => tx.stats.p95))},
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Transaction Response Times'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate Playwright summary page
 */
function generatePlaywrightSummary(playwrightData, playwrightDir, playwrightSummary) {
    const html = generatePlaywrightSummaryHTML(playwrightData);
    fs.writeFileSync(playwrightSummary, html, 'utf-8');
    console.log(`   ✓ Playwright summary generated`);
}

/**
 * Generate Playwright summary HTML
 */
function generatePlaywrightSummaryHTML(playwrightData) {
    if (!playwrightData || (!playwrightData.hasConsolidatedReport && !playwrightData.hasPlaywrightUIReport && playwrightData.testCount === 0)) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Playwright Summary - No Data</title>
    ${getCommonStyles()}
</head>
<body>
    <div class="container">
        <h1>🎭 Playwright UI Tests Summary</h1>
        <div class="empty-state">
            <p>No Playwright test results available</p>
        </div>
        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
    }

    // Generate test summary table with expandable action rows
    const testTableRows =
        playwrightData.individualTests && playwrightData.individualTests.length > 0
            ? playwrightData.individualTests
                  .map((test, index) => {
                      const statusBadge =
                          test.status === 'passed'
                              ? '<span class="status-badge status-success">✓ Passed</span>'
                              : test.status === 'failed'
                                ? '<span class="status-badge status-error">✗ Failed</span>'
                                : test.status === 'warning'
                                  ? '<span class="status-badge status-warning">⚠ Warning</span>'
                                  : '<span class="status-badge">-</span>';

                      const pageLoadTimeDisplay = test.pageLoadTime ? `${test.pageLoadTime}ms` : 'N/A';

                      const actionsCount = test.actions ? test.actions.length : 0;
                      const totalActionTime = test.actions ? test.actions.reduce((sum, a) => sum + a.duration, 0) : 0;

                      // Generate actions list as table rows
                      const actionsList =
                          test.actions && test.actions.length > 0
                              ? (() => {
                                    const totalTime = test.actions.reduce((sum, a) => sum + a.duration, 0);
                                    return test.actions
                                        .map((action, actionIndex) => {
                                            const duration = action.duration;
                                            const actionStatus = duration > 3000 ? 'slow' : duration > 1000 ? 'medium' : 'fast';
                                            const statusText = duration > 3000 ? 'Poor' : duration > 1000 ? 'Needs Improvement' : 'Good';
                                            const statusBadgeClass = duration > 3000 ? 'status-error' : duration > 1000 ? 'status-warning' : 'status-success';

                                            // Format duration
                                            const durationDisplay = duration >= 1000 ? `${(duration / 1000).toFixed(2)}s` : `${duration}ms`;

                                            // Calculate percentage
                                            const percentage = totalTime > 0 ? ((duration / totalTime) * 100).toFixed(1) : 0;

                                            // Format timestamp
                                            const timestampDisplay = action.timestamp ? new Date(action.timestamp).toLocaleTimeString() : '-';

                                            return `
                                    <tr class="action-row action-${actionStatus}">
                                        <td class="text-center" style="border-left: 4px solid ${
                                            actionStatus === 'slow' ? '#ff4e42' : actionStatus === 'medium' ? '#ffa400' : '#0cce6b'
                                        };">${actionIndex + 1}</td>
                                        <td><strong>${escapeHtml(action.name)}</strong></td>
                                        <td class="text-center"><span class="duration-${actionStatus}" style="font-weight:600;">${durationDisplay}</span></td>
                                        <td class="text-center">${percentage}%</td>
                                        <td class="text-center"><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                                        <td class="text-center" style="color: #6c757d; font-size: 0.85em;">${timestampDisplay}</td>
                                    </tr>
                                `;
                                        })
                                        .join('');
                                })()
                              : '<tr><td colspan="6" class="text-center">No actions tracked</td></tr>';

                      const hasActions = test.actions && test.actions.length > 0;
                      const rowId = `test-row-${index}`;
                      const actionsRowId = `actions-row-${index}`;

                      return `
                <tr class="test-row" id="${rowId}">
                    <td>${index + 1}</td>
                    <td><strong>${escapeHtml(test.testName)}</strong></td>
                    <td class="metric-value">${pageLoadTimeDisplay}</td>
                    <td>${actionsCount}</td>
                    <td>${totalActionTime > 0 ? `${totalActionTime}ms` : 'N/A'}</td>
                    <td>
                        ${
                            hasActions
                                ? `<button class="toggle-actions-btn" onclick="toggleActions('${actionsRowId}', this)" title="Click to ${actionsRowId.includes('expanded') ? 'collapse' : 'expand'} actions">
                                <span class="toggle-icon">▼</span> ${actionsCount} action${actionsCount !== 1 ? 's' : ''}
                            </button>`
                                : 'No actions'
                        }
                    </td>
                    <td>${statusBadge}</td>
                </tr>
                ${
                    hasActions
                        ? `
                <tr class="actions-detail-row" id="${actionsRowId}" style="display: none;">
                    <td colspan="7">
                        <div class="actions-container">
                            <div class="actions-header" style="margin-bottom: 15px; font-size: 1.1em; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Action Details</div>
                            <table class="actions-table" style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <thead>
                                    <tr style="background-color: #f1f3f5; color: #495057;">
                                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; width: 50px;">#</th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Action Name</th>
                                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; width: 120px;">Duration</th>
                                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; width: 100px;">% Total</th>
                                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; width: 150px;">Status</th>
                                        <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6; width: 120px;">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${actionsList}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
                `
                        : ''
                }
            `;
                  })
                  .join('')
            : '<tr><td colspan="7" class="text-center">No test data available</td></tr>';

    // Calculate summary statistics
    const passedTests = playwrightData.individualTests ? playwrightData.individualTests.filter((t) => t.status === 'passed').length : 0;
    const failedTests = playwrightData.individualTests ? playwrightData.individualTests.filter((t) => t.status === 'failed').length : 0;
    const warningTests = playwrightData.individualTests ? playwrightData.individualTests.filter((t) => t.status === 'warning').length : 0;
    const avgPageLoadTime =
        playwrightData.individualTests && playwrightData.individualTests.length > 0
            ? Math.round(playwrightData.individualTests.filter((t) => t.pageLoadTime).reduce((sum, t) => sum + t.pageLoadTime, 0) / playwrightData.individualTests.filter((t) => t.pageLoadTime).length)
            : 0;
    const totalActions = playwrightData.individualTests ? playwrightData.individualTests.reduce((sum, t) => sum + (t.actions ? t.actions.length : 0), 0) : 0;

    // Prepare chart data for individual action timings (grouped by action name)
    const chartData = {
        actionLabels: [],
        avgDurations: [],
        maxDurations: [],
        actionCounts: [],
        allActions: [],
    };

    if (playwrightData.individualTests && playwrightData.individualTests.length > 0) {
        // Collect all actions
        playwrightData.individualTests.forEach((test) => {
            if (test.actions && test.actions.length > 0) {
                test.actions.forEach((action) => {
                    chartData.allActions.push({
                        testName: test.testName,
                        actionName: action.name,
                        duration: action.duration,
                    });
                });
            }
        });

        // Group actions by name and calculate stats
        const actionGroups = {};
        chartData.allActions.forEach((action) => {
            if (!actionGroups[action.actionName]) {
                actionGroups[action.actionName] = {
                    durations: [],
                    testNames: [],
                };
            }
            actionGroups[action.actionName].durations.push(action.duration);
            actionGroups[action.actionName].testNames.push(action.testName);
        });

        // Calculate average and max for each action group
        Object.keys(actionGroups)
            .sort()
            .forEach((actionName) => {
                const group = actionGroups[actionName];
                const durations = group.durations;
                const avg = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
                const max = Math.max(...durations);

                chartData.actionLabels.push(actionName);
                chartData.avgDurations.push(avg);
                chartData.maxDurations.push(max);
                chartData.actionCounts.push(durations.length);
            });
    }

    // Playwright UI Report links section (for multi-file version)
    // Individual test reports are stored in playwrightData.individualTests array
    const hasIndividualReports = playwrightData.individualTests && playwrightData.individualTests.length > 0;
    const individualReportsList = hasIndividualReports
        ? playwrightData.individualTests
              .map(
                  (test) => `
                    <div style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                        <a href="../playwright-reports/${escapeHtml(test.filename)}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 500;">
                            ${escapeHtml(test.testName)}
                        </a>
                    </div>
                `
              )
              .join('')
        : '';

    const playwrightUIReportSection = `
            <!-- Additional Reports -->
            ${
                playwrightData.hasConsolidatedReport || playwrightData.hasPerformanceReport || playwrightData.hasPlaywrightUIReport || hasIndividualReports
                    ? `
            <div class="section">
                <h2 class="section-title">📋 Additional Reports</h2>
                <div class="report-links" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
                    ${
                        playwrightData.hasConsolidatedReport
                            ? `
                    <div class="report-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; color: #333;">📊 Consolidated Report</h3>
                        <p style="color: #666; font-size: 0.9em; margin: 10px 0;">Aggregated performance metrics across multiple test runs</p>
                        <a href="../playwright-reports/consolidated-report.html" class="btn-primary" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: opacity 0.2s;">
                            Open Consolidated Report →
                        </a>
                    </div>
                    `
                            : ''
                    }
                    ${
                        playwrightData.hasPerformanceReport
                            ? `
                    <div class="report-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; color: #333;">⚡ Performance Report</h3>
                        <p style="color: #666; font-size: 0.9em; margin: 10px 0;">Detailed performance analysis with action-level metrics</p>
                        <a href="../playwright-reports/playwright-performance/performance-report.html" class="btn-primary" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: opacity 0.2s;">
                            Open Performance Report →
                        </a>
                    </div>
                    `
                            : ''
                    }
                    ${
                        hasIndividualReports
                            ? `
                    <div class="report-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; color: #333;">📄 Individual Test Reports</h3>
                        <p style="color: #666; font-size: 0.9em; margin: 10px 0;">View detailed reports for each individual test execution</p>
                        <div style="max-height: 300px; overflow-y: auto; margin-top: 15px; border: 1px solid #e0e0e0; border-radius: 6px; background: #f8f9fa;">
                            ${individualReportsList}
                        </div>
                    </div>
                    `
                            : ''
                    }
                    ${
                        playwrightData.hasPlaywrightUIReport && playwrightData.playwrightUIReportPath
                            ? `
                    <div class="report-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; color: #333;">🎭 UI Automation Report</h3>
                        <p style="color: #666; font-size: 0.9em; margin: 10px 0;">Complete Playwright test execution report with screenshots and traces</p>
                        <a href="${playwrightData.playwrightUIReportPath}" class="btn-primary" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: opacity 0.2s;">
                            Open UI Automation Report →
                        </a>
                    </div>
                    `
                            : ''
                    }
                </div>
            </div>
            `
                    : ''
            }
            `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright UI Tests Summary</title>
    ${getCommonStyles()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
    <style>
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }
        .status-success {
            background-color: #0cce6b;
            color: white;
        }
        .status-error {
            background-color: #ff4e42;
            color: white;
        }
        .status-warning {
            background-color: #ffa400;
            color: white;
        }
        .test-summary-table {
            margin-top: 20px;
        }
        .test-summary-table td {
            vertical-align: top;
            padding: 12px;
        }
        .test-summary-table td:nth-child(6) {
            font-size: 0.9em;
        }
        .text-center {
            text-align: center;
        }
        .toggle-actions-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85em;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.2s;
        }
        .toggle-actions-btn:hover {
            background: #5568d3;
        }
        .toggle-icon {
            transition: transform 0.3s;
            font-size: 0.8em;
        }
        .toggle-icon.expanded {
            transform: rotate(180deg);
        }
        .actions-detail-row {
            background-color: #f8f9fa;
        }
        .actions-detail-row td {
            padding: 0 !important;
        }
        .actions-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-top: 10px;
        }
        .actions-table th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            padding: 12px 15px;
            font-size: 0.85em;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .actions-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f1f3f5;
            font-size: 0.9em;
            vertical-align: middle;
            color: #212529;
        }
        .actions-table tr:last-child td {
            border-bottom: none;
        }
        .actions-table tr:hover {
            background-color: #f8f9fa;
        }
        /* Action row status indicators */
        .action-row.action-fast td:first-child {
            border-left: 4px solid #0cce6b;
        }
        .action-row.action-medium td:first-child {
            border-left: 4px solid #ffa400;
        }
        .action-row.action-slow td:first-child {
            border-left: 4px solid #ff4e42;
        }

        /* Duration coloring */
        .duration-fast { color: #0cce6b; font-weight: 600; }
        .duration-medium { color: #ffa400; font-weight: 600; }
        .duration-slow { color: #ff4e42; font-weight: 600; }

        .actions-container {
            padding: 15px 20px;
            background-color: #f8f9fa;
            border-left: 3px solid #667eea;
        }
        .actions-header {
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
            font-size: 0.9em;
        }
    </style>
    <script>
        function toggleActions(rowId, button) {
            const row = document.getElementById(rowId);
            const icon = button.querySelector('.toggle-icon');
            if (row.style.display === 'none') {
                row.style.display = '';
                icon.classList.add('expanded');
                button.title = 'Click to collapse actions';
            } else {
                row.style.display = 'none';
                icon.classList.remove('expanded');
                button.title = 'Click to expand actions';
            }
        }

        function toggleIframe(containerId, button) {
            const container = document.getElementById(containerId);
            const icon = document.getElementById('iframe-toggle-icon');
            if (container.style.display === 'none') {
                container.style.display = 'block';
                if (icon) icon.classList.add('expanded');
                button.title = 'Click to collapse report';
            } else {
                container.style.display = 'none';
                if (icon) icon.classList.remove('expanded');
                button.title = 'Click to expand report';
            }
        }

        // Initialize action performance chart
        document.addEventListener('DOMContentLoaded', function() {
            const chartCanvas = document.getElementById('actionPerformanceChart');
            if (chartCanvas && typeof Chart !== 'undefined') {
                const chartData = ${JSON.stringify({
                    actionLabels: chartData.actionLabels,
                    avgDurations: chartData.avgDurations,
                    maxDurations: chartData.maxDurations,
                    actionCounts: chartData.actionCounts,
                })};

                if (chartData.actionLabels.length > 0) {
                    // Threshold values
                    const needsImprovementThreshold = 1000; // 1 second
                    const poorThreshold = 3000; // 3 seconds

                    new Chart(chartCanvas.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: chartData.actionLabels.map((label, idx) => {
                                // Truncate long action names
                                const maxLength = 40;
                                return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
                            }),
                            datasets: [
                                {
                                    label: 'Avg Duration (ms)',
                                    data: chartData.avgDurations,
                                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                    borderColor: 'rgba(102, 126, 234, 1)',
                                    borderWidth: 1
                                },
                                {
                                    label: 'Max Duration (ms)',
                                    data: chartData.maxDurations,
                                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                    borderColor: 'rgba(255, 99, 132, 1)',
                                    borderWidth: 1
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Action Duration (ms)'
                                    }
                                },
                                x: {
                                    ticks: {
                                        maxRotation: 60,
                                        minRotation: 60,
                                        font: {
                                            size: 10
                                        }
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top'
                                },
                                title: {
                                    display: true,
                                    text: 'Action Performance (Grouped by Action Name)'
                                },
                                tooltip: {
                                    callbacks: {
                                        title: function(context) {
                                            const index = context[0].dataIndex;
                                            return chartData.actionLabels[index];
                                        },
                                        label: function(context) {
                                            const index = context.dataIndex;
                                            const count = chartData.actionCounts[index];
                                            const label = context.dataset.label;
                                            const value = context.parsed.y;
                                            return [
                                                label + ': ' + value + 'ms',
                                                'Occurrences: ' + count
                                            ];
                                        }
                                    }
                                },
                                annotation: {
                                    annotations: {
                                        needsImprovementLine: {
                                            type: 'line',
                                            yMin: needsImprovementThreshold,
                                            yMax: needsImprovementThreshold,
                                            borderColor: 'rgba(255, 193, 7, 0.8)',
                                            borderWidth: 2,
                                            borderDash: [5, 5],
                                            label: {
                                                display: true,
                                                content: 'Needs Improvement (1000ms)',
                                                position: 'end',
                                                backgroundColor: 'rgba(255, 193, 7, 0.8)',
                                                color: '#856404',
                                                font: {
                                                    size: 11,
                                                    weight: 'bold'
                                                }
                                            }
                                        },
                                        poorLine: {
                                            type: 'line',
                                            yMin: poorThreshold,
                                            yMax: poorThreshold,
                                            borderColor: 'rgba(220, 53, 69, 0.8)',
                                            borderWidth: 2,
                                            borderDash: [5, 5],
                                            label: {
                                                display: true,
                                                content: 'Poor (3000ms)',
                                                position: 'end',
                                                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                                                color: '#721c24',
                                                font: {
                                                    size: 11,
                                                    weight: 'bold'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Playwright UI Tests Summary</h1>
            <p>Performance Testing Results</p>
        </div>

        <div class="content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <h3>Total Tests</h3>
                    <div class="value">${playwrightData.testCount || 0}</div>
                </div>
                <div class="card">
                    <h3>Passed</h3>
                    <div class="value" style="color: #28a745;">${passedTests}</div>
                </div>
                <div class="card">
                    <h3>Failed</h3>
                    <div class="value" style="color: #dc3545;">${failedTests}</div>
                </div>
                <div class="card">
                    <h3>Warnings</h3>
                    <div class="value" style="color: #ffc107;">${warningTests}</div>
                </div>
                ${
                    avgPageLoadTime > 0
                        ? `
                <div class="card">
                    <h3>Avg Page Load</h3>
                    <div class="value">${avgPageLoadTime}ms</div>
                </div>
                `
                        : ''
                }
                ${
                    totalActions > 0
                        ? `
                <div class="card">
                    <h3>Total Actions</h3>
                    <div class="value">${totalActions}</div>
                </div>
                `
                        : ''
                }
            </div>

            <!-- Test Performance Summary -->
            ${
                playwrightData.individualTests && playwrightData.individualTests.length > 0
                    ? `
            <div class="section">
                <h2 class="section-title">Test Performance Summary</h2>

                ${
                    chartData.actionLabels.length > 0
                        ? `
                <div style="margin-bottom: 30px;">
                    <h3 style="font-size: 1.1em; color: #555; margin-bottom: 15px;">Individual Action Performance Chart</h3>
                    <div class="chart-container" style="height: 500px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <canvas id="actionPerformanceChart"></canvas>
                    </div>
                </div>
                `
                        : ''
                }

                <div class="table-container test-summary-table">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Test Name</th>
                                <th>Page Load Time</th>
                                <th>Actions Count</th>
                                <th>Total Action Time</th>
                                <th>Actions</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${testTableRows}
                        </tbody>
                    </table>
                </div>
            </div>
            `
                    : ''
            }

            <!-- Aggregate Reports -->
            <!-- Additional Reports section removed -->

            ${playwrightUIReportSection}
        </div>

        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate Azure summary page
 */
function generateAzureSummary(azureData, jmeterData, azureDir, azureSummary, config) {
    const html = generateAzureSummaryHTML(azureData, jmeterData);
    fs.writeFileSync(azureSummary, html, 'utf-8');
    console.log(`   ✓ Azure summary generated`);
}

/**
 * Generate Azure summary HTML
 */
function generateAzureSummaryHTML(azureData, jmeterData) {
    if (!azureData) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Azure Load Test - No Data</title>
    ${getCommonStyles()}
</head>
<body>
    <div class="container">
        <h1>☁️ Azure Load Test Summary</h1>
        <div class="empty-state">
            <p>No Azure Load Test data available</p>
        </div>
        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
    }

    // Use JMeter data for accurate request count and duration
    const totalRequests = jmeterData ? jmeterData.totalRequests : azureData.totalRequests;
    const testDuration = jmeterData ? jmeterData.testDurationFormatted : 'N/A';
    const testDurationSeconds = jmeterData ? jmeterData.testDuration : 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure Load Test Summary</title>
    ${getCommonStyles()}
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>☁️ Azure Load Test Summary</h1>
            <p>Server Performance & Metrics</p>
        </div>

        <div class="content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <h3>Total Requests</h3>
                    <div class="value">${totalRequests.toLocaleString()}</div>
                    <div class="sub-value">All HTTP requests</div>
                </div>
                <div class="card">
                    <h3>Test Duration</h3>
                    <div class="value">${testDuration}</div>
                    <div class="sub-value">${testDurationSeconds} seconds</div>
                </div>
                <div class="card">
                    <h3>Engine Instances</h3>
                    <div class="value">1</div>
                    <div class="sub-value">Load test engines</div>
                </div>
            </div>

            <!-- Client-Side Performance Metrics -->
            ${
                jmeterData && jmeterData.transactions
                    ? `
            <div class="section">
                <h2 class="section-title">📊 Client-Side Performance Metrics</h2>
                <p style="color: #666; margin-bottom: 20px; font-size: 0.95em;">Metrics from JMeter load generators showing client-side performance and response times</p>

                <!-- Overall Performance -->
                <h3 style="font-size: 1.2em; color: #555; margin: 20px 0 15px;">📈 Overall Performance</h3>
                <div class="summary-cards">
                    <div class="card">
                        <h3>Total Transactions</h3>
                        <div class="value">${Object.keys(jmeterData.transactions).length}</div>
                        <div class="sub-value">Transaction controllers</div>
                    </div>
                    <div class="card">
                        <h3>Total Requests</h3>
                        <div class="value">${jmeterData.totalRequests.toLocaleString()}</div>
                        <div class="sub-value">HTTP requests sent</div>
                    </div>
                    <div class="card">
                        <h3>Success Rate</h3>
                        <div class="value" style="color: ${(parseFloat(jmeterData.passPercentage) || 0) >= 95 ? '#28a745' : (parseFloat(jmeterData.passPercentage) || 0) >= 80 ? '#ffc107' : '#dc3545'};">${(parseFloat(jmeterData.passPercentage) || 0).toFixed(1)}%</div>
                        <div class="sub-value">${jmeterData.totalSuccessCount.toLocaleString()} / ${jmeterData.totalSamples.toLocaleString()}</div>
                    </div>
                    <div class="card ${jmeterData.totalErrorCount > 0 ? 'error-card' : 'success-card'}">
                        <h3>Errors</h3>
                        <div class="value">${jmeterData.totalErrorCount.toLocaleString()}</div>
                        <div class="sub-value">${jmeterData.totalErrorCount > 0 ? '⚠️ Errors detected' : '✓ No errors'}</div>
                    </div>
                </div>

                <!-- Transaction Performance Summary -->
                <h3 style="font-size: 1.2em; color: #555; margin: 30px 0 15px;">🔄 Transaction Performance</h3>
                <div class="table-container" style="margin-bottom: 20px;">
                    <table>
                        <thead>
                            <tr>
                                <th>Transaction</th>
                                <th>Avg Response Time</th>
                                <th>95th Percentile</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>Samples</th>
                                <th>Success Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(jmeterData.transactions)
                                .filter((tx) => {
                                    const name = tx.name.toLowerCase();
                                    return !name.includes('insert') && !name.includes('clean');
                                })
                                .sort((a, b) => b.stats.avg - a.stats.avg)
                                .slice(0, 10)
                                .map(
                                    (tx) => `
                            <tr>
                                <td><strong>${escapeHtml(tx.name)}</strong></td>
                                <td class="metric-value">${tx.stats.avg}ms</td>
                                <td class="metric-value">${tx.stats.p95}ms</td>
                                <td>${tx.stats.min}ms</td>
                                <td>${tx.stats.max}ms</td>
                                <td>${tx.totalSamples}</td>
                                <td class="${parseFloat(tx.errorRate) > 0 ? 'status-error' : 'status-success'}">
                                    ${(100 - parseFloat(tx.errorRate)).toFixed(1)}%
                                </td>
                            </tr>
                            `
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
                ${
                    Object.keys(jmeterData.transactions).length > 10
                        ? `
                <p style="text-align: center; color: #666; font-size: 0.9em; margin-top: 10px;">
                    Showing top 10 transactions by average response time.
                    <a href="../jmeter/summary.html" style="color: #667eea;">View all transactions →</a>
                </p>
                `
                        : ''
                }
            </div>
            `
                    : ''
            }

            <!-- Server-Side Metrics Dashboard -->
            ${
                azureData.serverMetrics && azureData.serverMetrics.serverMetrics && azureData.serverMetrics.serverMetrics.hasData
                    ? `
            <div class="section">
                <h2 class="section-title">📊 Server-Side Performance Metrics</h2>

                <!-- App Service Plan Metrics -->
                <h3 style="font-size: 1.2em; color: #555; margin: 20px 0 15px;">🏗️ App Service Plan</h3>
                <div class="summary-cards">
                    <div class="card">
                        <h3>CPU Usage</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.appServicePlan.cpuPercentage.avg}%</div>
                        <div class="sub-value">Avg | Max: ${azureData.serverMetrics.serverMetrics.appServicePlan.cpuPercentage.max}%</div>
                    </div>
                    <div class="card">
                        <h3>Memory Usage</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.appServicePlan.memoryPercentage.avg}%</div>
                        <div class="sub-value">Avg | Max: ${azureData.serverMetrics.serverMetrics.appServicePlan.memoryPercentage.max}%</div>
                    </div>
                </div>

                <!-- Per-App Service Metrics (Like Azure Portal) -->
                ${Object.values(azureData.serverMetrics.serverMetrics.appServices || {})
                    .map(
                        (appService) => `
                <h3 style="font-size: 1.2em; color: #555; margin: 30px 0 15px;">🖥️ ${appService.name}</h3>
                <div class="summary-cards">
                    <div class="card">
                        <h3>HTTP Response Time</h3>
                        <div class="value">${appService.httpResponseTime.avg}ms</div>
                        <div class="sub-value">Avg | Max: ${appService.httpResponseTime.max}ms</div>
                    </div>
                    <div class="card">
                        <h3>Total Requests</h3>
                        <div class="value">${appService.requests.total.toLocaleString()}</div>
                        <div class="sub-value">Processed</div>
                    </div>
                    <div class="card ${appService.http5xx.total > 0 ? 'error-card' : 'success-card'}">
                        <h3>HTTP 5xx Errors</h3>
                        <div class="value">${appService.http5xx.total}</div>
                        <div class="sub-value">${appService.http5xx.total > 0 ? '⚠️ Server errors' : '✓ No errors'}</div>
                    </div>
                </div>
                `
                    )
                    .join('')}

                <!-- Database Metrics -->
                <h3 style="font-size: 1.2em; color: #555; margin: 30px 0 15px;">🗄️ Database Performance</h3>
                <div class="summary-cards">
                    <div class="card">
                        <h3>Database CPU</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.database.cpuPercent.avg}%</div>
                        <div class="sub-value">Avg | Max: ${azureData.serverMetrics.serverMetrics.database.cpuPercent.max}%</div>
                    </div>
                    <div class="card ${azureData.serverMetrics.serverMetrics.database.connectionsFailed.total > 0 ? 'warning-card' : 'success-card'}">
                        <h3>Connection Failures</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.database.connectionsFailed.total}</div>
                        <div class="sub-value">${azureData.serverMetrics.serverMetrics.database.connectionsFailed.total > 0 ? '⚠️ Failed connections' : '✓ All successful'}</div>
                    </div>
                    <div class="card ${azureData.serverMetrics.serverMetrics.database.deadlocks.total > 0 ? 'error-card' : 'success-card'}">
                        <h3>Deadlocks</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.database.deadlocks.total}</div>
                        <div class="sub-value">${azureData.serverMetrics.serverMetrics.database.deadlocks.total > 0 ? '⚠️ Deadlocks detected' : '✓ No deadlocks'}</div>
                    </div>
                </div>

                <!-- Storage Metrics -->
                <h3 style="font-size: 1.2em; color: #555; margin: 30px 0 15px;">💾 Storage Performance</h3>
                <div class="summary-cards">
                    <div class="card">
                        <h3>Availability</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.storage.availability.avg}%</div>
                        <div class="sub-value">Average</div>
                    </div>
                    <div class="card">
                        <h3>E2E Latency</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.storage.successE2ELatency.avg}ms</div>
                        <div class="sub-value">End-to-end</div>
                    </div>
                    <div class="card">
                        <h3>Server Latency</h3>
                        <div class="value">${azureData.serverMetrics.serverMetrics.storage.successServerLatency.avg}ms</div>
                        <div class="sub-value">Server-side</div>
                    </div>
                </div>
            </div>
            `
                    : `
            <!-- Server Metrics Notice -->
            <div class="section">
                <h2 class="section-title">📊 Server Performance Metrics</h2>
                <div class="azure-portal-card" style="background: #fff3cd; border-left-color: #ffc107;">
                    <p style="color: #856404;"><strong>ℹ️ Server metrics (CPU, Memory, Database, etc.) are available in Azure Portal</strong></p>
                    <p style="color: #856404; font-size: 0.95em;">These metrics are collected by Azure Monitor and displayed in the portal's test run dashboard. They include:</p>
                    <ul style="text-align: left; color: #856404; margin: 15px auto; max-width: 600px; line-height: 1.8;">
                        <li><strong>CPU Percentage</strong> - App Service & App Service Plan</li>
                        <li><strong>Memory Percentage</strong> - App Service Plan</li>
                        <li><strong>HTTP Response Time</strong> - App Services</li>
                        <li><strong>Database Metrics</strong> - SQL Server CPU, connections, deadlocks</li>
                        <li><strong>Storage Metrics</strong> - Availability, latency, capacity</li>
                    </ul>
                    <p style="color: #856404; font-size: 0.9em; margin-top: 15px;">Click the portal link below to view these real-time server metrics.</p>
                </div>
            </div>
            `
            }

            <!-- Dashboard Links -->
            <div class="section">
                <h2 class="section-title">📊 Dashboards & Reports</h2>
                <div class="report-links">
                    ${
                        azureData.hasAzureDashboard
                            ? `
                    <div class="report-card">
                        <h3>📊 Azure Load Test Dashboard</h3>
                        <p>Interactive Azure Load Test dashboard with response times, errors, virtual users, and more</p>
                        <a href="dashboard/index.html" class="btn-primary" target="_blank">
                            Open Azure Dashboard →
                        </a>
                    </div>
                    `
                            : ''
                    }
                    ${
                        jmeterData
                            ? `
                    <div class="report-card">
                        <h3>📊 JMeter Transaction Summary</h3>
                        <p>Detailed transaction analysis with charts and performance breakdown</p>
                        <a href="../jmeter/summary.html" class="btn-primary" target="_blank">
                            Open JMeter Summary →
                        </a>
                    </div>
                    `
                            : ''
                    }
                    <div class="report-card">
                        <h3>🔗 Azure Load Testing Portal</h3>
                        <p>View complete test run details, server metrics, and performance insights in Azure Portal</p>
                        <a href="${azureData.portalUrl}" class="btn-azure" target="_blank">
                            <span>🔗</span> ${azureData.testRunId ? 'Open Test Run Report' : 'Open Azure Load Testing'} →
                        </a>
                        ${azureData.testRunId ? `<p class="note" style="margin-top: 10px; font-size: 0.85em; color: #666;">Test Run ID: ${azureData.testRunId}</p>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate transaction detail pages
 */
function generateTransactionDetails(transactions, jmeterDir) {
    const transactionsDir = path.join(jmeterDir, 'transactions');

    Object.values(transactions).forEach((transaction) => {
        const filename = sanitizeFilename(transaction.name) + '.html';
        const filepath = path.join(transactionsDir, filename);

        const html = generateTransactionDetailHTML(transaction);
        fs.writeFileSync(filepath, html, 'utf-8');
    });

    console.log(`   ✓ Generated ${Object.keys(transactions).length} transaction detail pages`);
}

/**
 * Generate transaction detail HTML
 */
function generateTransactionDetailHTML(transaction) {
    // Group child requests by transaction execution (using execution-specific array)
    const childRequestsByExecution = transaction.childRequestsByExecution || [];

    const sampleRows = transaction.samples
        .map((sample, index) => {
            const executionId = 'exec-' + index;
            // Get child requests for this specific execution (much more accurate than timestamp matching)
            const executionChildRequests = childRequestsByExecution[index] || [];

            // Always use execution-specific child requests if available
            // Only fall back to unique child requests if this execution has no child requests at all
            // This ensures we show the correct (potentially failed) child requests for failed transactions
            const samplersToShow = executionChildRequests.length > 0 ? executionChildRequests : transaction.uniqueChildRequests || [];

            const samplersRows = samplersToShow
                .map((req, idx) => {
                    return `
                            <tr class="sampler-row" style="background-color: #f8f9fa;">
                                <td></td>
                                <td style="padding-left: 40px;">
                                    <span style="color: #667eea;">└─</span> ${escapeHtml(req.label)}
                                </td>
                                <td class="metric-value">${req.elapsed || 0} ms</td>
                                <td>${req.latency || 0} ms</td>
                                <td>${req.connect || 0} ms</td>
                                <td>${req.responseCode || ''}</td>
                                <td class="${req.success ? 'status-success' : 'status-error'}">
                                    ${req.success ? '✓ Success' : '✗ Failed'}
                                </td>
                                <td>${formatBytes(req.bytes || 0)}</td>
                            </tr>
                        `;
                })
                .join('');

            const hasSamplers = samplersToShow.length > 0;
            const expandIcon = hasSamplers ? '<span class="expand-icon" style="cursor: pointer; margin-right: 8px; font-weight: bold; color: #667eea;">▼</span>' : '';

            return `
        <tr class="execution-row" data-execution-id="${executionId}" style="cursor: ${hasSamplers ? 'pointer' : 'default'};">
            <td>${expandIcon}${index + 1}</td>
            <td>${escapeHtml(sample.label)}</td>
            <td class="metric-value">${sample.elapsed} ms</td>
            <td>${sample.latency} ms</td>
            <td>${sample.connect} ms</td>
            <td>${sample.responseCode}</td>
            <td class="${sample.success ? 'status-success' : 'status-error'}">
                ${sample.success ? '✓ Success' : '✗ Failed'}
            </td>
            <td>${formatBytes(sample.bytes)}</td>
        </tr>
        ${
            hasSamplers
                ? `
        <tr class="samplers-container" id="${executionId}-samplers" style="display: none;">
            <td colspan="8" style="padding: 0;">
                <div style="background-color: #f8f9fa; padding: 15px;">
                    <table style="width: 100%; margin: 0;">
                        <thead>
                            <tr style="background-color: #e9ecef;">
                                <th style="width: 5%;"></th>
                                <th style="width: 25%;">Sampler / API Request</th>
                                <th style="width: 12%;">Response Time</th>
                                <th style="width: 10%;">Latency</th>
                                <th style="width: 10%;">Connect Time</th>
                                <th style="width: 10%;">Response Code</th>
                                <th style="width: 13%;">Status</th>
                                <th style="width: 15%;">Bytes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${samplersRows}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        `
                : ''
        }
    `;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction: ${escapeHtml(transaction.name)}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    ${getCommonStyles()}
    <style>
        .status-success { color: #0cce6b; font-weight: bold; }
        .status-error { color: #ff4e42; font-weight: bold; }
        .chart-container { margin: 30px 0; height: 300px; }
        .toggle-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.75em;
            font-weight: 600;
            margin-left: 15px;
            transition: background 0.2s;
        }
        .toggle-btn:hover {
            background: #5568d3;
        }
        .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Transaction Details</h1>
            <p>${escapeHtml(transaction.name)}</p>
        </div>

        <div class="content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <h3>Total Samples</h3>
                    <div class="value">${transaction.totalSamples}</div>
                </div>
                <div class="card">
                    <h3>Success Rate</h3>
                    <div class="value">${((transaction.successCount / transaction.totalSamples) * 100).toFixed(1)}%</div>
                    <div class="sub-value">${transaction.successCount} / ${transaction.totalSamples}</div>
                </div>
                <div class="card">
                    <h3>Avg Response Time</h3>
                    <div class="value">${transaction.stats.avg} ms</div>
                </div>
                <div class="card">
                    <h3>95th Percentile</h3>
                    <div class="value">${transaction.stats.p95} ms</div>
                </div>
            </div>

            <!-- Response Time Distribution Chart -->
            <div class="section">
                <h2 class="section-title">Response Time Distribution</h2>
                <div class="chart-container">
                    <canvas id="responseTimeChart"></canvas>
                </div>
            </div>

            <!-- Transaction Executions Table -->
            <div class="section">
                <h2 class="section-title">Transaction Executions</h2>
                <p style="color: #666; margin-bottom: 15px;">Each row represents one complete execution of this transaction. Click on a row to expand and view API samplers within that execution.</p>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Transaction</th>
                                <th>Response Time</th>
                                <th>Latency</th>
                                <th>Connect Time</th>
                                <th>Response Code</th>
                                <th>Status</th>
                                <th>Bytes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sampleRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="footer">
            <a href="../summary.html" class="btn-back">← Back to JMeter Summary</a>
        </div>
    </div>

    <script>
        // Handle execution row expansion
        document.querySelectorAll('.execution-row').forEach(row => {
            row.addEventListener('click', function(e) {
                if (e.target.classList.contains('expand-icon')) return;
                const executionId = this.getAttribute('data-execution-id');
                const samplersContainer = document.getElementById(executionId + '-samplers');
                const expandIcon = this.querySelector('.expand-icon');
                if (samplersContainer) {
                    if (samplersContainer.style.display === 'none') {
                        samplersContainer.style.display = '';
                        if (expandIcon) expandIcon.textContent = '▲';
                    } else {
                        samplersContainer.style.display = 'none';
                        if (expandIcon) expandIcon.textContent = '▼';
                    }
                }
            });
        });
    </script>

    <script>
        // Response Time Distribution Chart
        const responseTimes = ${JSON.stringify(transaction.samples.map((s) => s.elapsed))};

        // Create histogram bins
        const min = Math.min(...responseTimes);
        const max = Math.max(...responseTimes);
        const binCount = 20;
        const binSize = Math.ceil((max - min) / binCount);

        const bins = new Array(binCount).fill(0);
        const binLabels = [];

        for (let i = 0; i < binCount; i++) {
            const binStart = min + (i * binSize);
            binLabels.push(binStart + '-' + (binStart + binSize));
        }

        responseTimes.forEach(rt => {
            const binIndex = Math.min(Math.floor((rt - min) / binSize), binCount - 1);
            bins[binIndex]++;
        });

        const ctx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Number of Requests',
                    data: bins,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Requests'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Response Time Range (ms)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Response Time Distribution'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate AI Analysis summary
 */
function generateAIAnalysisSummary(aiAnalysis, aiAnalysisDir, aiAnalysisSummary) {
    const html = generateAIAnalysisSummaryHTML(aiAnalysis);
    fs.writeFileSync(aiAnalysisSummary, html, 'utf-8');
    console.log(`   ✓ AI Analysis summary generated`);
}

/**
 * Generate AI Analysis summary HTML
 */
function generateAIAnalysisSummaryHTML(aiAnalysis) {
    if (!aiAnalysis) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Analysis - No Data</title>
    ${getCommonStyles()}
</head>
<body>
    <div class="container">
        <h1>🤖 AI Analysis</h1>
        <div class="empty-state">
            <p>AI analysis is not available</p>
        </div>
        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
    }

    // Add styles for AI analysis
    const aiAnalysisStyles = `
        <style>
            .ai-analysis-content {
                margin: 30px 0;
            }
            .analysis-metadata {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .analysis-metadata h3 {
                margin-top: 0;
                color: #333;
            }
            .metadata-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .metadata-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .metadata-label {
                font-weight: 600;
                color: #666;
                font-size: 0.9em;
            }
            .metadata-value {
                color: #333;
                font-size: 1em;
            }
            .analysis-text {
                line-height: 1.8;
                color: #333;
            }
            .analysis-text h2 {
                color: #667eea;
                margin-top: 30px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }
            .analysis-text h3 {
                color: #764ba2;
                margin-top: 25px;
                margin-bottom: 12px;
            }
            .analysis-text p {
                margin-bottom: 15px;
            }
            .analysis-text ul {
                margin-left: 20px;
                margin-bottom: 15px;
            }
            .analysis-text li {
                margin-bottom: 8px;
            }
            .analysis-text strong {
                color: #667eea;
            }
            .fallback-message {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .fallback-message h3 {
                color: #856404;
                margin-top: 0;
            }
            .fallback-message p {
                color: #856404;
                margin-bottom: 10px;
            }
        </style>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Analysis Summary</title>
    ${getCommonStyles()}
    ${aiAnalysisStyles}
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Analysis</h1>
            <p>AI-Powered Performance Insights & Recommendations</p>
        </div>
        <div class="content">
            ${aiAnalysis.html || '<div class="empty-state">No analysis available</div>'}
        </div>
        <div class="footer">
            <a href="../index.html" class="btn-back">← Back to Dashboard</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate master dashboard
 */
function generateMasterDashboard(jmeterData, playwrightData, azureData, aiAnalysis, masterDashboard, config) {
    const html = generateMasterDashboardHTML(jmeterData, playwrightData, azureData, aiAnalysis, config);
    fs.writeFileSync(masterDashboard, html, 'utf-8');
    console.log(`   ✓ Master dashboard generated`);
}

/**
 * Generate master dashboard HTML
 */
function generateMasterDashboardHTML(jmeterData, playwrightData, azureData, aiAnalysis, reportConfig = null) {
    const timestamp = new Date().toLocaleString();

    // Prepare data for UI vs API comparison chart (only if automation is enabled and both data sources available)
    let chartData = null;
    const automationEnabled = reportConfig?.features?.automation !== false;
    if (automationEnabled && jmeterData && jmeterData.transactions && Object.keys(jmeterData.transactions).length > 0 && playwrightData && playwrightData.individualTests && playwrightData.individualTests.length > 0) {
        // Extract UI metrics - create entries for both test-level and action-level metrics
        const uiMetrics = [];
        const uiActionMetrics = []; // Individual actions for matching

        playwrightData.individualTests.forEach((test) => {
            if (test.pageLoadTime) {
                const avgActionTime = test.actions && test.actions.length > 0 ? test.actions.reduce((sum, a) => sum + (a.duration || 0), 0) / test.actions.length : null;

                // Add test-level metric
                uiMetrics.push({
                    name: test.testName,
                    pageLoadTime: test.pageLoadTime,
                    avgActionTime: avgActionTime,
                    isTestLevel: true,
                });

                // Add individual action metrics for better matching with API transactions
                if (test.actions && test.actions.length > 0) {
                    test.actions.forEach((action) => {
                        if (action.name && action.duration) {
                            uiActionMetrics.push({
                                name: action.name,
                                actionTime: action.duration,
                                pageLoadTime: test.pageLoadTime, // Use test's page load time
                                testName: test.testName,
                            });
                        }
                    });
                }
            }
        });

        // Combine test-level and action-level metrics
        const allUIMetrics = [...uiMetrics, ...uiActionMetrics];

        // Extract API metrics (exclude setup/teardown transactions)
        const apiMetrics = [];
        Object.values(jmeterData.transactions)
            .filter((tx) => {
                const name = tx.name.toLowerCase();
                return !name.includes('insert') && !name.includes('clean');
            })
            .forEach((tx) => {
                apiMetrics.push({
                    name: tx.name,
                    avgResponseTime: tx.stats.avg,
                });
            });

        chartData = {
            uiMetrics: allUIMetrics,
            apiMetrics: apiMetrics,
        };
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified Performance Report Dashboard</title>
    ${getCommonStyles()}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .dashboard-card h2 {
            margin-top: 0;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dashboard-card .icon {
            font-size: 2em;
        }
        .dashboard-card .stats {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .dashboard-card .stat-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .dashboard-card .stat-label {
            color: #666;
        }
        .dashboard-card .stat-value {
            font-weight: bold;
            color: #333;
        }
        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        .btn-primary:hover {
            opacity: 0.9;
        }
        .chart-container {
            margin: 30px 0;
            height: 500px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .comparison-chart-section {
            margin-top: 40px;
            margin-bottom: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Unified Performance Report Dashboard</h1>
            <p>Complete performance testing overview - Generated on ${timestamp}</p>
        </div>

        <div class="content">
            <!-- Test Configuration Summary -->
            <div class="section">
                <h2 class="section-title">Test Execution Timeline</h2>
                <div class="summary-cards">
                    ${
                        jmeterData && jmeterData.startTime
                            ? `
                    <div class="card">
                        <h3>Test Start Time</h3>
                        <div class="value" style="font-size: 1.2em;">${jmeterData.startTime} ${jmeterData.timezone || ''}</div>
                        <div class="sub-value">Load test initiated</div>
                    </div>
                    <div class="card">
                        <h3>Test End Time</h3>
                        <div class="value" style="font-size: 1.2em;">${jmeterData.endTime} ${jmeterData.timezone || ''}</div>
                        <div class="sub-value">Load test completed</div>
                    </div>
                    <div class="card">
                        <h3>Total Duration</h3>
                        <div class="value">${jmeterData.testDurationFormatted}</div>
                        <div class="sub-value">${jmeterData.testDuration} seconds</div>
                    </div>
                    `
                            : `
                    <div class="card">
                        <h3>Test Execution</h3>
                        <div class="value">Complete</div>
                        <div class="sub-value">All test suites executed</div>
                    </div>
                    `
                    }
                </div>
            </div>

            <!-- Test Summary -->
            ${
                jmeterData
                    ? `
            <div class="section">
                <h2 class="section-title">
                    📊 Test Summary
                    <span style="
                        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
                        color: white;
                        padding: 6px 16px;
                        border-radius: 20px;
                        font-size: 0.6em;
                        font-weight: 600;
                        margin-left: 15px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    ">Environment: ${jmeterData.userConfig.environment}</span>
                </h2>

                <!-- User Configuration -->
                <div class="subsection">
                    <h3 style="font-size: 1.2em; color: #555; margin-bottom: 15px;">User Load Configuration</h3>
                    <div class="summary-cards">
                        ${(
                            reportConfig?.userTypes || [
                                { key: 'districtCoordinators', displayName: 'District Coordinators' },
                                { key: 'schoolUsers', displayName: 'School Users' },
                                { key: 'gtAdmins', displayName: 'GT Admins' },
                                { key: 'stateAdmins', displayName: 'State Admins' },
                            ]
                        )
                            .map(
                                (userType) => `
                        <div class="card">
                            <h3>${userType.displayName}</h3>
                            <div class="value">${jmeterData.userConfig[userType.key] || 0}</div>
                            <div class="sub-value">Concurrent users</div>
                        </div>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <!-- Pass/Fail Statistics -->
                <div class="subsection" style="margin-top: 30px;">
                    <h3 style="font-size: 1.2em; color: #555; margin-bottom: 15px;">Success Rate</h3>
                    <div class="summary-cards">
                        <div class="card ${jmeterData.passPercentage >= 99 ? 'success-card' : jmeterData.passPercentage >= 95 ? 'warning-card' : 'error-card'}">
                            <h3>Pass Percentage</h3>
                            <div class="value">${jmeterData.passPercentage}%</div>
                            <div class="sub-value">${jmeterData.totalSuccessCount.toLocaleString()} / ${jmeterData.totalRequests.toLocaleString()} requests</div>
                        </div>
                        <div class="card">
                            <h3>Total Requests</h3>
                            <div class="value">${jmeterData.totalRequests.toLocaleString()}</div>
                            <div class="sub-value">All HTTP requests</div>
                        </div>
                        <div class="card">
                            <h3>Successful Requests</h3>
                            <div class="value">${jmeterData.totalSuccessCount.toLocaleString()}</div>
                            <div class="sub-value" style="color: #0cce6b;">✓ Passed</div>
                        </div>
                        ${
                            jmeterData.totalErrorCount > 0
                                ? `
                        <div class="card">
                            <h3>Failed Requests</h3>
                            <div class="value" style="color: #ff4e42;">${jmeterData.totalErrorCount.toLocaleString()}</div>
                            <div class="sub-value" style="color: #ff4e42;">✗ Failed</div>
                        </div>
                        `
                                : ''
                        }
                    </div>
                </div>

                <!-- Error Analysis (only if errors exist) -->
                ${
                    jmeterData.errorAnalysis && jmeterData.errorAnalysis.hasErrors
                        ? `
                <div class="subsection" style="margin-top: 30px;">
                    <h3 style="font-size: 1.2em; color: #555; margin-bottom: 15px;">⚠️ Error Analysis</h3>

                    <!-- Error Types -->
                    <div class="error-types" style="margin-bottom: 20px;">
                        <h4 style="font-size: 1em; color: #666; margin-bottom: 10px;">Errors by Type</h4>
                        <div class="summary-cards">
                            ${Object.values(jmeterData.errorAnalysis.errorsByType)
                                .map(
                                    (error) => `
                            <div class="card" style="border-left: 4px solid #ff4e42;">
                                <h3>HTTP ${escapeHtml(error.code)}</h3>
                                <div class="value" style="color: #ff4e42;">${error.count}</div>
                                <div class="sub-value">${escapeHtml(error.message.substring(0, 50))}${error.message.length > 50 ? '...' : ''}</div>
                            </div>
                            `
                                )
                                .join('')}
                        </div>
                    </div>

                    <!-- Top 5 Errors by Sampler -->
                    <div class="top-errors">
                        <h4 style="font-size: 1em; color: #666; margin-bottom: 10px;">Top 5 Errors by Sampler</h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Sampler / Request</th>
                                        <th>Error Count</th>
                                        <th>Error Type</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${jmeterData.errorAnalysis.topErrorsBySampler
                                        .map(
                                            (error, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td><strong>${escapeHtml(error.sampler)}</strong></td>
                                        <td class="metric-value" style="color: #ff4e42;">${error.count}</td>
                                        <td>${escapeHtml(error.errorType)}</td>
                                        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${escapeHtml(error.message.substring(0, 100))}${error.message.length > 100 ? '...' : ''}
                                        </td>
                                    </tr>
                                    `
                                        )
                                        .join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                `
                        : ''
                }
            </div>
            `
                    : ''
            }

            <!-- Dashboard Cards -->
            <div class="dashboard-grid">
                <!-- JMeter Card -->
                <div class="dashboard-card">
                    <h2>
                        <span class="icon">📊</span>
                        JMeter Load Test
                    </h2>
                    <p>Backend API performance and transaction analysis</p>

                    ${
                        jmeterData
                            ? `
                    <div class="stats">
                        <div class="stat-row">
                            <span class="stat-label">Total Samples:</span>
                            <span class="stat-value">${jmeterData.totalSamples.toLocaleString()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Transactions:</span>
                            <span class="stat-value">${Object.keys(jmeterData.transactions).length}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Duration:</span>
                            <span class="stat-value">~${jmeterData.testDuration}s</span>
                        </div>
                    </div>
                    `
                            : '<div class="empty-state">No data available</div>'
                    }

                    <a href="jmeter/summary.html" class="btn-primary">
                        View JMeter Report →
                    </a>
                </div>

                <!-- Playwright Card (only if automation is enabled) -->
                ${
                    automationEnabled
                        ? `
                <div class="dashboard-card">
                    <h2>
                        <span class="icon">🎭</span>
                        Playwright UI Tests
                    </h2>
                    <p>Frontend UI performance during peak load</p>

                    ${
                        playwrightData
                            ? `
                    <div class="stats">
                        <div class="stat-row">
                            <span class="stat-label">Total Tests:</span>
                            <span class="stat-value">${playwrightData.testCount}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Reports Available:</span>
                            <span class="stat-value">
                                ${(playwrightData.hasConsolidatedReport ? 1 : 0) + (playwrightData.hasPerformanceReport ? 1 : 0)}
                            </span>
                        </div>
                    </div>
                    `
                            : '<div class="empty-state">No data available</div>'
                    }

                    <a href="playwright/summary.html" class="btn-primary">
                        View Playwright Report →
                    </a>
                </div>
                `
                        : ''
                }

                <!-- Azure Card -->
                <div class="dashboard-card">
                    <h2>
                        <span class="icon">☁️</span>
                        Azure Load Test
                    </h2>
                    <p>Server metrics and Azure cloud performance</p>

                    ${
                        azureData
                            ? `
                    <div class="stats">
                        <div class="stat-row">
                            <span class="stat-label">Total Requests:</span>
                            <span class="stat-value">${jmeterData ? jmeterData.totalRequests.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">CPU Usage:</span>
                            <span class="stat-value">${azureData.metrics.cpuPercent}${azureData.metrics.cpuPercent !== 'N/A' ? '%' : ''}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Memory Usage:</span>
                            <span class="stat-value">${azureData.metrics.memoryPercent}${azureData.metrics.memoryPercent !== 'N/A' ? '%' : ''}</span>
                        </div>
                    </div>
                    `
                            : '<div class="empty-state">No data available</div>'
                    }

                    <a href="azure/summary.html" class="btn-primary">
                        View Azure Report →
                    </a>
                </div>

                <!-- AI Analysis Card (only if AI analysis is enabled) -->
                ${
                    reportConfig?.features?.aiAnalysis !== false
                        ? `
                <div class="dashboard-card">
                    <h2>
                        <span class="icon">🤖</span>
                        AI Analysis
                    </h2>
                    <p>AI-powered insights and recommendations</p>

                    ${
                        aiAnalysis && aiAnalysis.success
                            ? `
                    <div class="stats">
                        <div class="stat-row">
                            <span class="stat-label">Status:</span>
                            <span class="stat-value" style="color: #0cce6b;">✓ Available</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Model:</span>
                            <span class="stat-value">Google Gemini Pro</span>
                        </div>
                    </div>
                    `
                            : aiAnalysis && !aiAnalysis.success
                              ? `
                    <div class="stats">
                        <div class="stat-row">
                            <span class="stat-label">Status:</span>
                            <span class="stat-value" style="color: #ff9800;">⚠ Limited</span>
                        </div>
                    </div>
                    `
                              : '<div class="empty-state">Analysis unavailable</div>'
                    }

                    <a href="ai-analysis/summary.html" class="btn-primary">
                        View AI Analysis →
                    </a>
                </div>
                `
                        : ''
                }
            </div>

            <!-- UI vs API Performance Comparison Chart (only if automation is enabled and chart data available) -->
            ${
                automationEnabled && chartData
                    ? `
            <div class="section comparison-chart-section">
                <h2 class="section-title">📊 UI vs API Performance Comparison</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Compare UI metrics (Playwright) with API transaction times (JMeter) to identify performance bottlenecks
                </p>
                <div class="chart-container">
                    <canvas id="uiApiComparisonChart"></canvas>
                </div>
            </div>
            `
                    : ''
            }

            <!-- Quick Links -->
            <div class="section">
                <h2 class="section-title">Quick Links</h2>
                <div class="report-links">
                    <div class="report-card">
                        <h3>📊 JMeter Dashboard</h3>
                        <p>Original JMeter HTML dashboard with detailed statistics and charts</p>
                        <a href="jmeter/dashboard/index.html" class="btn-primary" target="_blank">
                            Open JMeter Dashboard →
                        </a>
                    </div>
                    ${
                        azureData
                            ? `
                    <div class="report-card">
                        <h3>☁️ Azure Portal</h3>
                        <p>View complete test run in Azure Load Testing portal</p>
                        <a href="${azureData.portalUrl}" class="btn-primary" target="_blank">
                            Open Azure Portal →
                        </a>
                    </div>
                    `
                            : ''
                    }
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by Unified Performance Testing Framework</p>
            <p style="font-size: 0.85em; color: #999;">JMeter + ${automationEnabled ? 'Playwright + ' : ''}Azure Load Testing${reportConfig?.features?.aiAnalysis !== false ? ' + AI Analysis' : ''}</p>
        </div>
    </div>
    ${
        automationEnabled && chartData
            ? `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const chartCanvas = document.getElementById('uiApiComparisonChart');
            if (!chartCanvas || typeof Chart === 'undefined') {
                return;
            }

            // Use pre-prepared chart data
            const comparisonData = ${JSON.stringify(chartData)};
            const uiMetrics = comparisonData.uiMetrics;
            const apiMetrics = comparisonData.apiMetrics;

            // Improved matching: Match API transactions with UI tests
            // Create a combined dataset where matched items show both UI and API metrics
            const combinedData = [];
            const processedUINames = new Set();
            const processedAPINames = new Set();

            // Normalize names for matching (remove special chars, lowercase)
            const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

            // First, try to match API transactions with UI tests/actions
            // This ensures API transaction names are used as the primary label
            apiMetrics.forEach(api => {
                const apiNormalized = normalizeName(api.name);
                let matchedUI = null;

                // First, try exact match with action names (best match)
                for (const ui of uiMetrics) {
                    const uiNormalized = normalizeName(ui.name);
                    // Exact match or very close match (for action-level metrics)
                    if (uiNormalized === apiNormalized ||
                        (uiNormalized.includes(apiNormalized) && apiNormalized.length > 3) ||
                        (apiNormalized.includes(uiNormalized) && uiNormalized.length > 3)) {
                        matchedUI = ui;
                        processedUINames.add(ui.name);
                        processedAPINames.add(api.name);
                        break;
                    }
                }

                // If no exact match found, try partial matching with test names
                if (!matchedUI) {
                    for (const ui of uiMetrics) {
                        const uiNormalized = normalizeName(ui.name);
                        // Check if API transaction name appears in UI test name or vice versa
                        if (uiNormalized.includes(apiNormalized) || apiNormalized.includes(uiNormalized)) {
                            matchedUI = ui;
                            processedUINames.add(ui.name);
                            processedAPINames.add(api.name);
                            break;
                        }
                    }
                }

                // Create entry with API transaction name as label
                combinedData.push({
                    label: api.name,
                    uiPageLoad: matchedUI ? matchedUI.pageLoadTime : null,
                    uiAvgAction: matchedUI ? (matchedUI.actionTime || matchedUI.avgActionTime) : null,
                    apiAvg: api.avgResponseTime,
                    hasMatch: !!matchedUI
                });
            });

            // Add unmatched UI tests (those that didn't match any API transaction)
            // Only add test-level metrics, not individual actions (to avoid clutter)
            uiMetrics.forEach(ui => {
                if (!processedUINames.has(ui.name) && ui.isTestLevel) {
                    combinedData.push({
                        label: ui.name + ' (UI Only)',
                        uiPageLoad: ui.pageLoadTime,
                        uiAvgAction: ui.avgActionTime,
                        apiAvg: null,
                        hasMatch: false
                    });
                }
            });

            // Sort by total time (UI or API, whichever is available)
            combinedData.sort((a, b) => {
                const aTime = a.uiPageLoad || a.apiAvg || 0;
                const bTime = b.uiPageLoad || b.apiAvg || 0;
                return bTime - aTime;
            });

            // Limit to top 15 for readability
            const displayData = combinedData.slice(0, 15);

            // Prepare chart data
            const labels = displayData.map(d => {
                // Truncate long labels
                const maxLength = 40;
                return d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
            });

            const uiPageLoadData = displayData.map(d => d.uiPageLoad || null);
            const uiActionData = displayData.map(d => d.uiAvgAction || null);
            const apiAvgData = displayData.map(d => d.apiAvg || null);

            // Create chart
            new Chart(chartCanvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'UI Page Load Time (ms)',
                            data: uiPageLoadData,
                            backgroundColor: 'rgba(102, 126, 234, 0.7)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 1,
                            order: 1
                        },
                        {
                            label: 'UI Avg Action Time (ms)',
                            data: uiActionData,
                            backgroundColor: 'rgba(52, 152, 219, 0.7)',
                            borderColor: 'rgba(52, 152, 219, 1)',
                            borderWidth: 1,
                            order: 2
                        },
                        {
                            label: 'API Avg Response Time (ms)',
                            data: apiAvgData,
                            backgroundColor: 'rgba(46, 204, 113, 0.7)',
                            borderColor: 'rgba(46, 204, 113, 1)',
                            borderWidth: 1,
                            order: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Time (milliseconds)'
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                    size: 10
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'UI Performance vs API Response Times',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    if (value === null || value === undefined) {
                                        return context.dataset.label + ': N/A';
                                    }
                                    return context.dataset.label + ': ' + value.toFixed(0) + ' ms';
                                }
                            }
                        }
                    }
                }
            });
        });
    </script>
    `
            : ''
    }
</body>
</html>`;
}

/**
 * Generate standalone HTML report
 */
function generateStandaloneHTML(jmeterData, playwrightData, azureData, aiAnalysis, config) {
    const timestamp = new Date().toLocaleString();
    const automationEnabled = config?.features?.automation !== false;
    const aiAnalysisEnabled = config?.features?.aiAnalysis !== false;

    // Serialize data for embedding in HTML
    const dataJson = JSON.stringify({
        jmeter: jmeterData,
        playwright: automationEnabled ? playwrightData : null,
        azure: azureData,
        aiAnalysis: aiAnalysisEnabled ? aiAnalysis : null,
        timestamp: timestamp,
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unified Performance Report - Standalone</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
    ${getCommonStyles()}
    <style>
        /* Dashboard Grid Styles */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }
        .dashboard-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        .dashboard-card h2 {
            margin-top: 0;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .dashboard-card .icon {
            font-size: 2em;
        }
        .dashboard-card .stats {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .dashboard-card .stat-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .dashboard-card .stat-label {
            color: #666;
        }
        .dashboard-card .stat-value {
            font-weight: bold;
            color: #333;
        }
        .subsection {
            margin-bottom: 20px;
        }

        /* Navigation Styles */
        .nav-bar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 15px 40px;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin: 0;
            width: 100%;
            left: 0;
            right: 0;
        }
        .nav-button {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        .nav-button:hover {
            background: rgba(255,255,255,0.3);
        }
        .nav-button.active {
            background: white;
            color: #667eea;
        }

        /* Section visibility */
        .report-section {
            display: none;
        }
        .report-section.active {
            display: block;
        }

        /* Chart containers */
        .chart-container {
            margin: 30px 0;
            height: 500px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
        }
        .comparison-chart-section {
            margin-top: 40px;
            margin-bottom: 40px;
        }

        /* Transaction detail styles */
        .transaction-detail {
            display: none;
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .transaction-detail.active {
            display: block;
        }

        .toggle-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: 600;
            margin-left: 15px;
            transition: background 0.2s;
        }
        .toggle-btn:hover {
            background: #5568d3;
        }

        .section-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        /* JMeter-specific styles */
        .transaction-row:hover {
            background: #f8f9fa;
            cursor: pointer;
        }
        .setup-transaction {
            display: none;
            background: #f9f9f9;
        }
        .setup-transaction.visible {
            display: table-row;
        }
        .btn-details {
            background: #667eea;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.85em;
            display: inline-block;
            border: none;
            cursor: pointer;
            font-weight: 600;
        }
        .btn-details:hover {
            background: #5568d3;
        }
        .error-rate {
            color: #ff4e42;
            font-weight: bold;
        }
        .success-rate {
            color: #0cce6b;
            font-weight: bold;
        }
        .status-success {
            color: #0cce6b;
            font-weight: bold;
        }
        .status-error {
            color: #ff4e42;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="nav-bar">
        <button class="nav-button active" onclick="showSection('dashboard', this)">🏠 Dashboard</button>
        <button class="nav-button" onclick="showSection('jmeter', this)">📊 JMeter</button>
        ${automationEnabled ? '<button class="nav-button" onclick="showSection(\'playwright\', this)">🎭 Playwright</button>' : ''}
        <button class="nav-button" onclick="showSection('azure', this)">☁️ Azure</button>
        ${aiAnalysisEnabled ? '<button class="nav-button" onclick="showSection(\'ai-analysis\', this)">🤖 AI Analysis</button>' : ''}
    </div>

    <div class="container">
        <!-- Dashboard Section -->
        <div id="section-dashboard" class="report-section active">
            ${generateDashboardSection(jmeterData, automationEnabled ? playwrightData : null, azureData, aiAnalysisEnabled ? aiAnalysis : null, config)}
        </div>

        <!-- JMeter Section -->
        <div id="section-jmeter" class="report-section">
            ${generateJMeterSection(jmeterData)}
        </div>

        <!-- Playwright Section (only if automation is enabled) -->
        ${automationEnabled ? `
        <div id="section-playwright" class="report-section">
            ${generatePlaywrightSection(playwrightData)}
        </div>
        ` : ''}

        <!-- Azure Section -->
        <div id="section-azure" class="report-section">
            ${generateAzureSection(azureData, jmeterData)}
        </div>

        <!-- AI Analysis Section (only if AI analysis is enabled) -->
        ${aiAnalysisEnabled ? `
        <div id="section-ai-analysis" class="report-section">
            ${generateAIAnalysisSection(aiAnalysis)}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated by Unified Performance Testing Framework - Standalone Report</p>
            <p style="font-size: 0.85em; color: #999;">Generated on ${timestamp}</p>
            <p style="font-size: 0.85em; color: #999;">This is a self-contained, shareable HTML file</p>
        </div>
    </div>

    <script>
        // Embedded data
        const reportData = ${dataJson};

        // Navigation
        function showSection(sectionName, buttonElement) {
            // Hide all sections
            document.querySelectorAll('.report-section').forEach(section => {
                section.classList.remove('active');
            });

            // Remove active from all buttons
            document.querySelectorAll('.nav-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected section
            const sectionElement = document.getElementById('section-' + sectionName);
            if (sectionElement) {
                sectionElement.classList.add('active');
            }

            // Mark button as active
            if (buttonElement) {
                buttonElement.classList.add('active');
            }

            // Initialize charts if needed
            if (sectionName === 'jmeter') {
                setTimeout(initializeJMeterCharts, 100);
            }
        }

        // Initialize JMeter charts
        function initializeJMeterCharts() {
            if (!reportData.jmeter || !reportData.jmeter.transactions) return;

            const transactions = Object.values(reportData.jmeter.transactions);
            const ctx = document.getElementById('jmeterPerformanceChart');
            if (!ctx) return;

            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: transactions.map(tx => tx.name),
                    datasets: [
                        {
                            label: 'Avg Response Time (ms)',
                            data: transactions.map(tx => tx.stats.avg),
                            backgroundColor: 'rgba(102, 126, 234, 0.8)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 1
                        },
                        {
                            label: '95th Percentile (ms)',
                            data: transactions.map(tx => tx.stats.p95),
                            backgroundColor: 'rgba(255, 99, 132, 0.8)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Response Time (ms)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Transaction Response Times'
                        }
                    }
                }
            });
        }

        // JMeter section functions
        let setupTransactionsVisible = false;

        function toggleSetupTransactions() {
            setupTransactionsVisible = !setupTransactionsVisible;
            const setupRows = document.querySelectorAll('.setup-transaction');
            const btn = document.getElementById('setupToggleBtn');

            if (!btn) return;

            setupRows.forEach(row => {
                if (setupTransactionsVisible) {
                    row.classList.add('visible');
                } else {
                    row.classList.remove('visible');
                }
            });

            const setupCount = setupRows.length;
            if (setupTransactionsVisible) {
                btn.innerHTML = '☑️ Hide Setup/Teardown (' + setupCount + ')';
            } else {
                btn.innerHTML = '☐ Show Setup/Teardown (' + setupCount + ')';
            }

            filterTransactions();
        }

        function filterTransactions() {
            const input = document.getElementById('transactionFilter');
            if (!input) return;

            const filter = input.value.toLowerCase();
            const tbody = document.getElementById('transactionTableBody');
            if (!tbody) return;

            const rows = tbody.getElementsByTagName('tr');
            let visibleCount = 0;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const transactionName = row.getElementsByTagName('td')[0];
                const isSetupRow = row.classList.contains('setup-transaction');

                if (transactionName) {
                    const txtValue = transactionName.textContent || transactionName.innerText;
                    const matchesFilter = txtValue.toLowerCase().indexOf(filter) > -1;
                    const shouldShow = matchesFilter && (!isSetupRow || setupTransactionsVisible);

                    if (shouldShow) {
                        if (isSetupRow) {
                            row.classList.add('visible');
                        }
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                }
            }

            const filterCount = document.getElementById('filterCount');
            if (filterCount) {
                if (filter) {
                    filterCount.textContent = 'Showing ' + visibleCount + ' transactions';
                } else {
                    filterCount.textContent = '';
                }
            }
        }

        function showTransactionDetail(transactionName) {
            if (!reportData.jmeter || !reportData.jmeter.transactions) return;

            const transactions = reportData.jmeter.transactions;
            const transaction = transactions[transactionName];

            if (!transaction) return;

            const modal = document.getElementById('transactionDetailModal');
            const modalName = document.getElementById('modalTransactionName');
            const modalContent = document.getElementById('modalTransactionContent');

            if (!modal || !modalName || !modalContent) return;

            modalName.textContent = transactionName;

            // Generate transaction detail content
            const responseTimes = transaction.samples.map(s => s.elapsed);
            const min = Math.min(...responseTimes);
            const max = Math.max(...responseTimes);
            const binCount = 20;
            const binSize = Math.ceil((max - min) / binCount);

            const bins = new Array(binCount).fill(0);
            const binLabels = [];

            for (let i = 0; i < binCount; i++) {
                const binStart = min + (i * binSize);
                binLabels.push(binStart + '-' + (binStart + binSize));
            }

            responseTimes.forEach(rt => {
                const binIndex = Math.min(Math.floor((rt - min) / binSize), binCount - 1);
                bins[binIndex]++;
            });

            const childRequestsByExecution = transaction.childRequestsByExecution || [];

            const sampleRows = transaction.samples.map((sample, index) => {
                const executionId = 'exec-' + index;
                const executionChildRequests = childRequestsByExecution[index] || [];
                const samplersToShow = executionChildRequests.length > 0
                    ? executionChildRequests
                    : (transaction.uniqueChildRequests || []);

                const samplersRows = samplersToShow.map((req, idx) => {
                    return '<tr class="sampler-row" style="background-color: #f8f9fa;">' +
                        '<td></td>' +
                        '<td style="padding-left: 40px;">' +
                            '<span style="color: #667eea;">└─</span> ' +
                            escapeHtmlForJS(req.label) +
                        '</td>' +
                        '<td class="metric-value">' + (req.elapsed || 0) + ' ms</td>' +
                        '<td>' + (req.latency || 0) + ' ms</td>' +
                        '<td>' + (req.connect || 0) + ' ms</td>' +
                        '<td>' + (req.responseCode || '') + '</td>' +
                        '<td class="' + (req.success ? 'status-success' : 'status-error') + '">' +
                            (req.success ? '✓ Success' : '✗ Failed') +
                        '</td>' +
                        '<td>' + formatBytesForJS(req.bytes || 0) + '</td>' +
                    '</tr>';
                }).join('');

                const hasSamplers = samplersToShow.length > 0;
                const expandIcon = hasSamplers ? '<span class="expand-icon" style="cursor: pointer; margin-right: 8px; font-weight: bold; color: #667eea;">▼</span>' : '';

                return '<tr class="execution-row" data-execution-id="' + executionId + '" style="cursor: ' + (hasSamplers ? 'pointer' : 'default') + ';">' +
                    '<td>' + expandIcon + (index + 1) + '</td>' +
                    '<td>' + escapeHtmlForJS(sample.label) + '</td>' +
                    '<td class="metric-value">' + sample.elapsed + ' ms</td>' +
                    '<td>' + (sample.latency || 0) + ' ms</td>' +
                    '<td>' + (sample.connect || 0) + ' ms</td>' +
                    '<td>' + (sample.responseCode || '') + '</td>' +
                    '<td class="' + (sample.success ? 'status-success' : 'status-error') + '">' +
                        (sample.success ? '✓ Success' : '✗ Failed') +
                    '</td>' +
                    '<td>' + formatBytesForJS(sample.bytes || 0) + '</td>' +
                '</tr>' +
                (hasSamplers ? '<tr class="samplers-container" id="' + executionId + '-samplers" style="display: none;">' +
                    '<td colspan="8" style="padding: 0;">' +
                        '<div style="background-color: #f8f9fa; padding: 15px;">' +
                            '<table style="width: 100%; margin: 0;">' +
                                '<thead>' +
                                    '<tr style="background-color: #e9ecef;">' +
                                        '<th style="width: 5%;"></th>' +
                                        '<th style="width: 25%;">Sampler / API Request</th>' +
                                        '<th style="width: 12%;">Response Time</th>' +
                                        '<th style="width: 10%;">Latency</th>' +
                                        '<th style="width: 10%;">Connect Time</th>' +
                                        '<th style="width: 10%;">Response Code</th>' +
                                        '<th style="width: 13%;">Status</th>' +
                                        '<th style="width: 15%;">Bytes</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' +
                                    samplersRows +
                                '</tbody>' +
                            '</table>' +
                        '</div>' +
                    '</td>' +
                '</tr>' : '');
            }).join('');

            modalContent.innerHTML =
                '<div class="summary-cards">' +
                    '<div class="card">' +
                        '<h3>Total Samples</h3>' +
                        '<div class="value">' + transaction.totalSamples + '</div>' +
                    '</div>' +
                    '<div class="card">' +
                        '<h3>Success Rate</h3>' +
                        '<div class="value">' + ((transaction.successCount / transaction.totalSamples) * 100).toFixed(1) + '%</div>' +
                        '<div class="sub-value">' + transaction.successCount + ' / ' + transaction.totalSamples + '</div>' +
                    '</div>' +
                    '<div class="card">' +
                        '<h3>Avg Response Time</h3>' +
                        '<div class="value">' + transaction.stats.avg + ' ms</div>' +
                    '</div>' +
                    '<div class="card">' +
                        '<h3>95th Percentile</h3>' +
                        '<div class="value">' + transaction.stats.p95 + ' ms</div>' +
                    '</div>' +
                '</div>' +
                '<div class="section" style="margin-top: 30px;">' +
                    '<h3 style="font-size: 1.2em; color: #555; margin-bottom: 15px;">Response Time Distribution</h3>' +
                    '<div class="chart-container" style="height: 300px;">' +
                        '<canvas id="modalResponseTimeChart"></canvas>' +
                    '</div>' +
                '</div>' +
                '<div class="section" style="margin-top: 30px;">' +
                    '<h3 style="font-size: 1.2em; color: #555; margin-bottom: 15px;">Transaction Executions</h3>' +
                    '<p style="color: #666; margin-bottom: 15px;">Each row represents one complete execution of this transaction. Click on a row to expand and view API samplers within that execution.</p>' +
                    '<div class="table-container">' +
                        '<table>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th>#</th>' +
                                    '<th>Transaction</th>' +
                                    '<th>Response Time</th>' +
                                    '<th>Latency</th>' +
                                    '<th>Connect Time</th>' +
                                    '<th>Response Code</th>' +
                                    '<th>Status</th>' +
                                    '<th>Bytes</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                sampleRows +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';

            modal.style.display = 'block';

            setTimeout(() => {
                const executionRows = modalContent.querySelectorAll('.execution-row');
                executionRows.forEach(row => {
                    row.addEventListener('click', function(e) {
                        if (e.target.classList.contains('expand-icon')) return;
                        const executionId = this.getAttribute('data-execution-id');
                        const samplersContainer = document.getElementById(executionId + '-samplers');
                        const expandIcon = this.querySelector('.expand-icon');
                        if (samplersContainer) {
                            if (samplersContainer.style.display === 'none') {
                                samplersContainer.style.display = '';
                                if (expandIcon) expandIcon.textContent = '▲';
                            } else {
                                samplersContainer.style.display = 'none';
                                if (expandIcon) expandIcon.textContent = '▼';
                            }
                        }
                    });
                });
            }, 50);

            setTimeout(() => {
                const chartCtx = document.getElementById('modalResponseTimeChart');
                if (chartCtx && typeof Chart !== 'undefined') {
                    new Chart(chartCtx.getContext('2d'), {
                        type: 'bar',
                        data: {
                            labels: binLabels,
                            datasets: [{
                                label: 'Number of Requests',
                                data: bins,
                                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                                borderColor: 'rgba(102, 126, 234, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Number of Requests'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Response Time Range (ms)'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                title: {
                                    display: true,
                                    text: 'Response Time Distribution'
                                }
                            }
                        }
                    });
                }
            }, 100);
        }

        function closeTransactionDetail() {
            const modal = document.getElementById('transactionDetailModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function escapeHtmlForJS(text) {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;',
            };
            return String(text).replace(/[&<>"']/g, (m) => map[m]);
        }

        function formatBytesForJS(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
        }

        // Close modal when clicking outside
        document.addEventListener('click', function(event) {
            const modal = document.getElementById('transactionDetailModal');
            if (modal && event.target === modal) {
                closeTransactionDetail();
            }
        });

        // Initialize on load
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('section-jmeter') && document.getElementById('section-jmeter').classList.contains('active')) {
                initializeJMeterCharts();
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Generate dashboard section HTML for standalone report
 */
function generateDashboardSection(jmeterData, playwrightData, azureData, aiAnalysis, config) {
    const fullHTML = generateMasterDashboardHTML(jmeterData, playwrightData, azureData, aiAnalysis, config);

    // Extract content between <div class="container"> and the closing </div> before </body>
    const containerStart = fullHTML.indexOf('<div class="container">');
    const bodyEnd = fullHTML.lastIndexOf('</body>');

    if (containerStart !== -1 && bodyEnd !== -1) {
        let content = fullHTML.substring(containerStart + '<div class="container">'.length, bodyEnd);

        // Find the matching closing </div> for the container
        let divCount = 1;
        let pos = 0;
        let lastDivPos = -1;

        while (divCount > 0 && pos < content.length) {
            const openDiv = content.indexOf('<div', pos);
            const closeDiv = content.indexOf('</div>', pos);

            if (closeDiv === -1) break;

            if (openDiv !== -1 && openDiv < closeDiv) {
                divCount++;
                pos = openDiv + 4;
            } else {
                divCount--;
                if (divCount === 0) {
                    lastDivPos = closeDiv;
                    break;
                }
                pos = closeDiv + 6;
            }
        }

        if (lastDivPos !== -1) {
            content = content.substring(0, lastDivPos);
        }

        // Remove the footer if it exists
        content = content.replace(/<div class="footer">[\s\S]*?<\/div>/g, '');

        // Convert links to JavaScript navigation for standalone version
        content = content.replace(/href="jmeter\/summary\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'jmeter\', this); return false;"');
        if (config?.features?.automation !== false) {
            content = content.replace(/href="playwright\/summary\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'playwright\', this); return false;"');
        }
        content = content.replace(/href="azure\/summary\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'azure\', this); return false;"');
        if (config?.features?.aiAnalysis !== false) {
            content = content.replace(/href="ai-analysis\/summary\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'ai-analysis\', this); return false;"');
        }
        content = content.replace(/href="\.\.\/index\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'dashboard\', this); return false;"');
        content = content.replace(
            /href="jmeter\/dashboard\/index\.html"/g,
            'href="javascript:void(0)" onclick="alert(\'JMeter Dashboard is not available in standalone report. Please use the multi-file version for full JMeter dashboard access.\'); return false;"'
        );
        content = content.replace(
            /href="dashboard\/index\.html"/g,
            'href="javascript:void(0)" onclick="alert(\'Azure Dashboard is not available in standalone report. Please use the multi-file version or Azure Portal for full dashboard access.\'); return false;"'
        );

        // Extract the comparison chart script if it exists
        let scriptContent = '';
        const scriptMarker = "document.getElementById('uiApiComparisonChart')";
        const scriptStartPos = fullHTML.indexOf(scriptMarker);

        if (scriptStartPos !== -1) {
            const scriptOpenTag = fullHTML.lastIndexOf('<script>', scriptStartPos);
            if (scriptOpenTag !== -1) {
                const scriptCloseTag = fullHTML.indexOf('</script>', scriptStartPos);
                if (scriptCloseTag !== -1) {
                    scriptContent = fullHTML.substring(scriptOpenTag, scriptCloseTag + 9);
                }
            }
        }

        return content + scriptContent;
    }

    return '<div class="content"><div class="empty-state"><p>Dashboard content unavailable</p></div></div>';
}

/**
 * Generate JMeter section HTML for standalone report
 */
function generateJMeterSection(jmeterData) {
    if (!jmeterData || !jmeterData.transactions) {
        return `
            <div class="header">
                <h1>📊 JMeter Load Test Summary</h1>
                <p>Transaction Performance Overview</p>
            </div>
            <div class="content">
                <div class="empty-state">
                    <p>No JMeter results available</p>
                </div>
            </div>
        `;
    }

    const transactions = Object.values(jmeterData.transactions);
    transactions.sort((a, b) => b.totalSamples - a.totalSamples);

    const businessTransactions = transactions.filter((tx) => !tx.name.toLowerCase().includes('insert') && !tx.name.toLowerCase().includes('clean'));
    const setupTransactions = transactions.filter((tx) => tx.name.toLowerCase().includes('insert') || tx.name.toLowerCase().includes('clean'));

    const transactionRows = transactions
        .map((tx) => {
            const isSetup = tx.name.toLowerCase().includes('insert') || tx.name.toLowerCase().includes('clean');
            return `
        <tr class="transaction-row ${isSetup ? 'setup-transaction' : 'business-transaction'}">
            <td><strong>${escapeHtml(tx.name)}</strong></td>
            <td>${tx.totalSamples.toLocaleString()}</td>
            <td class="metric-value">${tx.stats.avg} ms</td>
            <td>${tx.stats.min} ms</td>
            <td>${tx.stats.max} ms</td>
            <td>${tx.stats.p90} ms</td>
            <td>${tx.stats.p95} ms</td>
            <td>${tx.stats.p99} ms</td>
            <td class="${tx.errorRate > 0 ? 'error-rate' : 'success-rate'}">${tx.errorRate}%</td>
            <td>
                <button onclick="showTransactionDetail('${tx.name.replace(/'/g, "\\'")}')" class="btn-details">View Details →</button>
            </td>
        </tr>
    `;
        })
        .join('');

    return `
        <div class="header">
            <h1>📊 JMeter Load Test Summary</h1>
            <p>Transaction Performance Overview</p>
        </div>
        <div class="content">
            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="card">
                    <h3>Total Samples</h3>
                    <div class="value">${jmeterData.totalSamples.toLocaleString()}</div>
                </div>
                <div class="card">
                    <h3>Business Transactions</h3>
                    <div class="value">${businessTransactions.length}</div>
                    <div class="sub-value">User workflows</div>
                </div>
                <div class="card">
                    <h3>Setup/Teardown</h3>
                    <div class="value">${setupTransactions.length}</div>
                    <div class="sub-value">Hidden by default</div>
                </div>
                <div class="card">
                    <h3>Test Duration</h3>
                    <div class="value">${jmeterData.testDurationFormatted || jmeterData.testDuration + 's'}</div>
                    <div class="sub-value">${jmeterData.testDuration} seconds total</div>
                </div>
            </div>

            <!-- Performance Chart -->
            <div class="section">
                <h2 class="section-title">Response Time Distribution</h2>
                <div class="chart-container">
                    <canvas id="jmeterPerformanceChart"></canvas>
                </div>
            </div>

            <!-- Transaction Table -->
            <div class="section">
                <h2 class="section-title">
                    Transaction Details
                    <div style="display: flex; gap: 10px;">
                        <button onclick="toggleSetupTransactions()" class="toggle-btn" id="setupToggleBtn" style="font-size: 0.75em;">
                            ☐ Show Setup/Teardown (${setupTransactions.length})
                        </button>
                    </div>
                </h2>
                <p style="color: #666; margin-bottom: 15px;">
                    Showing ${businessTransactions.length} business transactions. Setup/Teardown transactions (Insert, Clean Up) are hidden by default.
                </p>

                <!-- Filter Input -->
                <div style="margin-bottom: 20px;">
                    <input
                        type="text"
                        id="transactionFilter"
                        placeholder="🔍 Filter by transaction name..."
                        style="
                            width: 100%;
                            max-width: 500px;
                            padding: 12px 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            font-size: 1em;
                            transition: border-color 0.2s;
                        "
                        onkeyup="filterTransactions()"
                        onfocus="this.style.borderColor='#667eea'"
                        onblur="this.style.borderColor='#e0e0e0'"
                    />
                    <span id="filterCount" style="margin-left: 15px; color: #666; font-size: 0.9em;"></span>
                </div>

                <div class="table-container">
                    <table id="transactionTable">
                        <thead>
                            <tr>
                                <th>Transaction Name</th>
                                <th>Samples</th>
                                <th>Avg Response Time</th>
                                <th>Min</th>
                                <th>Max</th>
                                <th>90th %ile</th>
                                <th>95th %ile</th>
                                <th>99th %ile</th>
                                <th>Error %</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactionTableBody">
                            ${transactionRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Transaction Detail Modal -->
        <div id="transactionDetailModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; overflow-y: auto;">
            <div style="background: white; margin: 50px auto; max-width: 900px; border-radius: 12px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 id="modalTransactionName" style="margin: 0;"></h2>
                    <button onclick="closeTransactionDetail()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
                </div>
                <div id="modalTransactionContent"></div>
            </div>
        </div>
    `;
}

/**
 * Generate Playwright section HTML for standalone report
 */
function generatePlaywrightSection(playwrightData) {
    if (!playwrightData || (!playwrightData.hasConsolidatedReport && !playwrightData.hasPlaywrightUIReport && playwrightData.testCount === 0)) {
        return `
            <div class="header">
                <h1>🎭 Playwright UI Tests Summary</h1>
                <p>Performance Testing Results</p>
            </div>
            <div class="content">
                <div class="empty-state">
                    <p>No Playwright test results available</p>
                </div>
            </div>
        `;
    }

    const fullHTML = generatePlaywrightSummaryHTML(playwrightData);
    const match = fullHTML.match(/<div class="container">([\s\S]*?)<\/div>\s*<\/body>/);
    if (match && match[1]) {
        let content = match[1];
        content = content.replace(/<div class="footer">[\s\S]*?<\/div>/, '');
        content = content.replace(/href="\.\.\/index\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'dashboard\', this); return false;"');
        content = content.replace(
            /href="\.\.\/playwright-reports\/([^"]+)"/g,
            'href="javascript:void(0)" onclick="alert(\'Individual Playwright reports are not available in standalone report. Please use the multi-file version for full report access.\'); return false;"'
        );
        content = content.replace(
            /href="\.\.\/\.\.\/playwright-report\/index\.html"/g,
            'href="javascript:void(0)" onclick="alert(\'UI Automation report is not available in standalone report. Please use the multi-file version for full report access.\'); return false;"'
        );

        const scriptMatch = fullHTML.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
            content += `\n<script>\n${scriptMatch[1]}\n</script>`;
        }

        return content;
    }
    return fullHTML;
}

/**
 * Generate Azure section HTML for standalone report
 */
function generateAzureSection(azureData, jmeterData) {
    if (!azureData) {
        return `
            <div class="header">
                <h1>☁️ Azure Load Test Summary</h1>
                <p>Server Performance & Metrics</p>
            </div>
            <div class="content">
                <div class="empty-state">
                    <p>No Azure Load Test data available</p>
                </div>
            </div>
        `;
    }

    const fullHTML = generateAzureSummaryHTML(azureData, jmeterData);
    const match = fullHTML.match(/<div class="container">([\s\S]*?)<\/div>\s*<\/body>/);
    if (match && match[1]) {
        let content = match[1];
        content = content.replace(/<div class="footer">[\s\S]*?<\/div>/, '');
        content = content.replace(/href="\.\.\/index\.html"/g, 'href="javascript:void(0)" onclick="showSection(\'dashboard\', this); return false;"');
        content = content.replace(
            /href="dashboard\/index\.html"/g,
            'href="javascript:void(0)" onclick="alert(\'Azure Dashboard is not available in standalone report. Please use the multi-file version or Azure Portal for full dashboard access.\'); return false;"'
        );

        return content;
    }
    return fullHTML;
}

/**
 * Generate AI Analysis section for standalone report
 */
function generateAIAnalysisSection(aiAnalysis) {
    if (!aiAnalysis) {
        return `
            <div class="header">
                <h1>🤖 AI Analysis</h1>
                <p>AI-Powered Performance Insights</p>
            </div>
            <div class="content">
                <div class="empty-state">
                    <p>AI analysis is not available</p>
                </div>
            </div>
        `;
    }

    const aiAnalysisStyles = `
        <style>
            .ai-analysis-content {
                margin: 30px 0;
            }
            .analysis-metadata {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .analysis-metadata h3 {
                margin-top: 0;
                color: #333;
            }
            .metadata-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            .metadata-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .metadata-label {
                font-weight: 600;
                color: #666;
                font-size: 0.9em;
            }
            .metadata-value {
                color: #333;
                font-size: 1em;
            }
            .analysis-text {
                line-height: 1.8;
                color: #333;
            }
            .analysis-text h2 {
                color: #667eea;
                margin-top: 30px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }
            .analysis-text h3 {
                color: #764ba2;
                margin-top: 25px;
                margin-bottom: 12px;
            }
            .analysis-text p {
                margin-bottom: 15px;
            }
            .analysis-text ul {
                margin-left: 20px;
                margin-bottom: 15px;
            }
            .analysis-text li {
                margin-bottom: 8px;
            }
            .analysis-text strong {
                color: #667eea;
            }
            .fallback-message {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .fallback-message h3 {
                color: #856404;
                margin-top: 0;
            }
            .fallback-message p {
                color: #856404;
                margin-bottom: 10px;
            }
        </style>
    `;

    return `
        ${aiAnalysisStyles}
        <div class="header">
            <h1>🤖 AI Analysis</h1>
            <p>AI-Powered Performance Insights & Recommendations</p>
        </div>
        <div class="content">
            ${aiAnalysis.html || '<div class="empty-state">No analysis available</div>'}
        </div>
    `;
}
