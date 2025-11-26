/**
 * AI-Powered Performance Report Analysis
 *
 * Uses Google Gemini API to analyze performance test results and generate insights.
 *
 * @param {Object} jmeterData - Parsed JMeter test results
 * @param {Object} playwrightData - Parsed Playwright test results
 * @param {Object} azureData - Azure server metrics
 * @param {Object} config - Configuration object with AI settings
 * @returns {Promise<Object>} Analysis result with HTML content and metadata
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate AI analysis of performance test results
 * @param {Object} jmeterData - Parsed JMeter test results
 * @param {Object} playwrightData - Parsed Playwright test results
 * @param {Object} azureData - Azure server metrics
 * @param {Object} config - Configuration object with AI settings
 * @returns {Promise<Object>} Analysis result with HTML content and metadata
 */
export async function generateAIAnalysis(jmeterData, playwrightData, azureData, config) {
    // Check if AI analysis is enabled
    if (!config || !config.features || !config.features.aiAnalysis) {
        console.log('⚠️  AI analysis is disabled in configuration. Skipping AI analysis.');
        return {
            success: false,
            error: 'AI analysis disabled',
            html: generateFallbackHTML('AI analysis is disabled in configuration. Enable it in config.js to use AI-powered analysis.'),
            timestamp: new Date().toLocaleString(),
        };
    }

    const aiConfig = config.ai || {};
    
    // Get API key from config or environment variable
    const apiKey = aiConfig.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log('⚠️  GEMINI_API_KEY not found. Skipping AI analysis.');
        console.log('   Tip: Set apiKey in config.ai or GEMINI_API_KEY environment variable');
        return {
            success: false,
            error: 'API key not configured',
            html: generateFallbackHTML('AI analysis is not configured. Please set apiKey in config.ai or GEMINI_API_KEY environment variable to enable AI-powered analysis.'),
            timestamp: new Date().toLocaleString(),
        };
    }

    // Log that API key was found (but don't log the actual key for security)
    console.log('✅ API key found. Generating AI analysis...');

    try {
        console.log('🤖 Generating AI analysis using Google Gemini API...');

        const genAI = new GoogleGenerativeAI(apiKey);

        // Prepare structured data for analysis
        const analysisData = prepareAnalysisData(jmeterData, playwrightData, azureData);

        // Create prompt for AI analysis
        const prompt = createAnalysisPrompt(analysisData);

        // Get model configuration from config
        const primaryModel = aiConfig.model || 'gemini-2.5-pro';
        const fallbackModels = aiConfig.fallbackModels || ['gemini-1.5-pro', 'gemini-pro'];
        
        // Build model list: primary first, then fallbacks
        const modelNames = [primaryModel, ...fallbackModels];

        let result, response, analysisText;
        let lastError = null;
        let successfulModel = null;

        for (const modelName of modelNames) {
            try {
                console.log(`   Trying model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                response = await result.response;
                analysisText = response.text();
                successfulModel = modelName;
                console.log(`   ✅ Successfully using model: ${modelName}`);
                break; // Success, exit loop
            } catch (modelError) {
                lastError = modelError;
                const errorMsg = modelError.message || '';
                if (errorMsg.includes('not found') || errorMsg.includes('404') || errorMsg.includes('is not found')) {
                    console.log(`   ⚠️  ${modelName} not available, trying next model...`);
                    continue; // Try next model
                } else {
                    // Different error (auth, rate limit, etc.)
                    console.log(`   ❌ Error with ${modelName}: ${errorMsg.substring(0, 80)}`);
                    if (errorMsg.includes('403') || errorMsg.includes('401') || errorMsg.includes('API key')) {
                        throw modelError; // Auth errors should stop immediately
                    }
                    continue; // Try next model for other errors
                }
            }
        }

        // If we exhausted all models, throw error
        if (!analysisText) {
            const errorMsg = lastError?.message || 'Unknown error';
            throw new Error(`All Gemini models failed. Last error: ${errorMsg}. Tried models: ${modelNames.join(', ')}`);
        }

        // Format the analysis as HTML
        const html = formatAnalysisAsHTML(analysisText, analysisData, successfulModel);

        console.log('✅ AI analysis generated successfully');

        return {
            success: true,
            html: html,
            rawAnalysis: analysisText,
            model: successfulModel,
            timestamp: new Date().toLocaleString(),
        };
    } catch (error) {
        console.error('❌ Error generating AI analysis:', error.message);
        return {
            success: false,
            error: error.message,
            html: generateFallbackHTML(`AI analysis failed: ${error.message}. The report will still be generated without AI insights.`),
            timestamp: new Date().toLocaleString(),
        };
    }
}

/**
 * Prepare structured data for AI analysis
 */
function prepareAnalysisData(jmeterData, playwrightData, azureData) {
    const data = {
        summary: {
            hasJMeter: !!jmeterData,
            hasPlaywright: !!playwrightData,
            hasAzure: !!azureData,
        },
        jmeter: null,
        playwright: null,
        azure: null,
    };

    // Extract JMeter insights
    if (jmeterData) {
        const transactions = jmeterData.transactions || {};
        const transactionList = Object.values(transactions);

        // Calculate overall stats
        const allResponseTimes = transactionList.flatMap((tx) => (tx.samples ? tx.samples.map((s) => s.elapsed) : []));

        data.jmeter = {
            totalTransactions: transactionList.length,
            totalSamples: jmeterData.totalSamples || 0,
            errorRate: jmeterData.errorRate || 0,
            avgResponseTime: allResponseTimes.length > 0 ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length : 0,
            slowestTransactions: transactionList
                .filter((tx) => tx.stats)
                .sort((a, b) => (b.stats?.avg || 0) - (a.stats?.avg || 0))
                .slice(0, 5)
                .map((tx) => ({
                    name: tx.name,
                    avgResponseTime: tx.stats?.avg || 0,
                    p95: tx.stats?.p95 || 0,
                    errorRate: tx.stats?.errorRate || 0,
                })),
            errors: jmeterData.errorAnalysis?.topErrorsBySampler || [],
        };
    }

    // Extract Playwright insights (only if automation is enabled)
    if (playwrightData) {
        const tests = playwrightData.individualTests || [];
        const pageLoadTimes = tests.filter((t) => t.pageLoadTime).map((t) => t.pageLoadTime);

        data.playwright = {
            totalTests: playwrightData.testCount || 0,
            avgPageLoadTime: pageLoadTimes.length > 0 ? pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length : 0,
            slowestTests: tests
                .filter((t) => t.pageLoadTime)
                .sort((a, b) => b.pageLoadTime - a.pageLoadTime)
                .slice(0, 5)
                .map((t) => ({
                    name: t.testName,
                    pageLoadTime: t.pageLoadTime,
                })),
        };
    }

    // Extract Azure insights
    // Azure data structure: azureData.serverMetrics.serverMetrics.appServicePlan, etc.
    if (azureData && azureData.serverMetrics) {
        const serverMetrics = azureData.serverMetrics.serverMetrics;

        if (serverMetrics) {
            // Extract App Service Plan metrics
            const appServicePlan = serverMetrics.appServicePlan || {};
            const cpuMetrics = appServicePlan.cpuPercentage || {};
            const memoryMetrics = appServicePlan.memoryPercentage || {};

            // Extract Database metrics
            const database = serverMetrics.database || {};
            const dbCpu = database.cpuPercent || {};

            // Extract Storage metrics
            const storage = serverMetrics.storage || {};

            data.azure = {
                hasServerMetrics: true,
                appServicePlan: {
                    avgCpu: cpuMetrics.avg || null,
                    maxCpu: cpuMetrics.max || null,
                    avgMemory: memoryMetrics.avg || null,
                    maxMemory: memoryMetrics.max || null,
                },
                database: {
                    avgCpu: dbCpu.avg || null,
                    maxCpu: dbCpu.max || null,
                    failedConnections: database.connectionsFailed?.total || 0,
                    deadlocks: database.deadlocks?.total || 0,
                },
                storage: {
                    availability: storage.availability?.avg || null,
                    e2eLatency: storage.successE2ELatency?.avg || null,
                    serverLatency: storage.successServerLatency?.avg || null,
                },
                // Also include top-level metrics for compatibility
                avgCpu: cpuMetrics.avg || azureData.metrics?.cpuPercent || null,
                maxCpu: cpuMetrics.max || null,
                avgMemory: memoryMetrics.avg || azureData.metrics?.memoryPercent || null,
                maxMemory: memoryMetrics.max || null,
            };
        } else if (azureData.metrics) {
            // Fallback to basic metrics if serverMetrics structure is different
            data.azure = {
                hasServerMetrics: false,
                basicMetrics: true,
                avgCpu: azureData.metrics.cpuPercent || null,
                avgMemory: azureData.metrics.memoryPercent || null,
            };
        }
    }

    return data;
}

/**
 * Create analysis prompt for Gemini API
 */
function createAnalysisPrompt(analysisData) {
    return `You are a performance testing expert analyzing a unified performance test report.
The report combines JMeter load test results, Playwright UI test results, and Azure server-side metrics.

Analyze the following performance data and provide:
1. **Executive Summary**: High-level overview of test results
2. **Key Findings**: Most important performance insights
3. **Bottlenecks**: Identify performance bottlenecks and slow operations
4. **Error Analysis**: Analyze any errors or failures
5. **Recommendations**: Actionable recommendations for improvement
6. **Trends**: Notable patterns or anomalies

Performance Data:
${JSON.stringify(analysisData, null, 2)}

IMPORTANT NOTES:
- If Azure data is present (hasServerMetrics: true), it includes App Service Plan CPU/Memory, Database metrics, and Storage metrics
- Azure metrics include: CPU usage (avg/max), Memory usage (avg/max), Database connections, deadlocks, and storage latency
- If Azure data shows "hasServerMetrics: false" but "basicMetrics: true", only basic CPU/Memory percentages are available
- JMeter data includes transaction response times, error rates, and sample counts
- Playwright data includes UI test page load times and action durations

Provide a comprehensive, professional analysis in clear, actionable language.
Format your response with clear sections using markdown headers (## for main sections, ### for subsections).
Focus on actionable insights that help improve application performance.
Do NOT include any conversational filler (e.g., "Here is the analysis...", "As an expert..."). Start directly with the Executive Summary.`;
}

/**
 * Format AI analysis text as HTML
 */
function formatAnalysisAsHTML(analysisText, analysisData, modelName = 'Google Gemini') {
    // Remove conversational filler if present (backup cleanup)
    let cleanText = analysisText.replace(/^(Of course|Certainly|Here is|As a performance testing expert).*?(\n\n|\r\n\r\n)/is, '');
    cleanText = cleanText.replace(/^\*\*\*.*?\n/ms, ''); // Remove separators if present

    // Convert markdown to HTML (simple conversion)
    let html = markdownToHTML(cleanText);

    // Add metadata section
    const metadata = `
        <div class="analysis-metadata">
            <h3>📊 Analysis Metadata</h3>
            <div class="metadata-grid">
                <div class="metadata-item">
                    <span class="metadata-label">Data Sources:</span>
                    <span class="metadata-value">
                        ${analysisData.summary.hasJMeter ? '✅ JMeter' : '❌ JMeter'} |
                        ${analysisData.summary.hasPlaywright ? '✅ Playwright' : '❌ Playwright'} |
                        ${analysisData.summary.hasAzure ? '✅ Azure' : '❌ Azure'}
                    </span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Analysis Model:</span>
                    <span class="metadata-value">${modelName}</span>
                </div>
            </div>
        </div>
    `;

    return `
        <div class="ai-analysis-content">
            ${metadata}
            <div class="analysis-text">
                ${html}
            </div>
        </div>
    `;
}

/**
 * Simple markdown to HTML converter
 */
function markdownToHTML(text) {
    return (
        text
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // Lists
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            // Wrap consecutive list items in ul
            .replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>')
            // Paragraphs
            .split('\n\n')
            .map((para) => {
                if (!para.trim()) return '';
                if (para.startsWith('<')) return para; // Already formatted
                return `<p>${para.trim()}</p>`;
            })
            .join('\n')
    );
}

/**
 * Generate fallback HTML when AI analysis is unavailable
 */
function generateFallbackHTML(message) {
    return `
        <div class="ai-analysis-content">
            <div class="fallback-message">
                <h3>⚠️ AI Analysis Unavailable</h3>
                <p>${message}</p>
                <p><em>Note: Rule-based analysis will be available in a future update.</em></p>
            </div>
        </div>
    `;
}
