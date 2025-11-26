/**
 * Azure Load Testing Metrics Fetcher
 *
 * Retrieves server-side metrics from Azure Load Testing and Azure Monitor
 * for inclusion in the unified performance report.
 *
 * @param {string} testRunId - Azure Load Test run ID
 * @param {Object} config - Configuration object with Azure settings
 * @returns {Promise<Object|null>} Metrics data or null on error
 */

import https from 'https';

/**
 * Get Azure AD access token
 * In Azure DevOps pipeline, this uses the service connection's managed identity
 */
async function getAccessToken(resource = 'https://management.azure.com/') {
    // In Azure DevOps pipeline with AzureCLI task, this is automatically available
    // via environment variables or Azure Identity SDK

    // Option 1: Use environment variable from AzureCLI task
    if (process.env.AZURE_ACCESS_TOKEN) {
        return process.env.AZURE_ACCESS_TOKEN;
    }

    // Option 2: Use Azure CLI to get token (works locally and in pipeline)
    // For Azure Load Testing data plane, we need a token for the load testing resource
    const { execSync } = await import('child_process');
    try {
        const token = execSync(`az account get-access-token --resource ${resource} --query accessToken -o tsv`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
        return token;
    } catch (error) {
        console.error('Failed to get Azure access token:', error.message);
        console.log('\n⚠️  To use this feature, run: az login');
        return null;
    }
}

/**
 * Make authenticated request to Azure REST API
 */
async function azureRequest(url, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        };

        https
            .get(url, options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve(data);
                        }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

/**
 * Get test run details from Azure Load Testing (using data plane API)
 */
async function getTestRunDetails(testRunId, dataPlaneUri, accessToken) {
    // Azure Load Testing uses a data plane endpoint
    const dataPlaneUrl = `https://${dataPlaneUri}/test-runs/${testRunId}?api-version=2024-05-01-preview`;

    console.log('Fetching test run details...');
    return await azureRequest(dataPlaneUrl, accessToken);
}

/**
 * Get server-side metrics for a test run (using data plane API)
 */
async function getTestRunServerMetrics(testRunId, dataPlaneUri, accessToken) {
    const dataPlaneUrl = `https://${dataPlaneUri}/test-runs/${testRunId}/server-metrics-config?api-version=2024-05-01-preview`;

    console.log('Fetching server-side metrics configuration...');
    return await azureRequest(dataPlaneUrl, accessToken);
}

/**
 * Get Azure Monitor metrics for a specific resource with appropriate aggregations
 */
async function getAzureMonitorMetrics(resourceId, metricNames, timespan, accessToken, aggregations = 'Average,Maximum,Total') {
    const metricsParam = metricNames.join(',');
    const url = `https://management.azure.com${resourceId}/providers/Microsoft.Insights/metrics?api-version=2023-10-01&timespan=${timespan}&metricnames=${metricsParam}&aggregation=${aggregations}`;

    console.log(`Fetching Azure Monitor metrics: ${metricNames.join(', ')}...`);
    const response = await azureRequest(url, accessToken);

    // Add resourceId to each metric for tracking
    if (response && response.value) {
        response.value.forEach((metric) => {
            metric.resourceId = resourceId;
        });
    }

    return response;
}

/**
 * Parse and aggregate server-side metrics per resource (like Azure Portal)
 */
export function aggregateMetrics(serverMetricsResponse) {
    const aggregated = {
        appServices: {}, // Will store metrics per app service
        appServicePlan: {
            cpuPercentage: { avg: 0, max: 0, min: 0 },
            memoryPercentage: { avg: 0, max: 0, min: 0 },
        },
        database: {
            cpuPercent: { avg: 0, max: 0, min: 0, sum: 0 },
            connectionsFailed: { total: 0 },
            deadlocks: { total: 0 },
        },
        storage: {
            availability: { avg: 0 },
            successE2ELatency: { avg: 0 },
            successServerLatency: { avg: 0 },
        },
        hasData: false,
    };

    if (!serverMetricsResponse || !serverMetricsResponse.value) {
        return aggregated;
    }

    // Process metrics from Azure Monitor response
    serverMetricsResponse.value.forEach((metric) => {
        const metricName = metric.name.value;
        const resourceId = metric.resourceId || metric.id || '';
        const timeseries = metric.timeseries || [];

        if (timeseries.length === 0) return;

        // Get the data points
        const dataPoints = timeseries[0].data || [];
        if (dataPoints.length === 0) return;

        aggregated.hasData = true;

        // Extract resource name from resource ID
        const resourceName = resourceId.split('/').pop() || 'unknown';

        // Determine which aggregation to use based on metric type
        const metricLower = metricName.toLowerCase();
        let values = [];

        // For count/total metrics, use total aggregation
        if (['requests', 'http5xx', 'connection_failed', 'deadlock'].includes(metricLower)) {
            values = dataPoints.map((dp) => dp.total || 0).filter((v) => v !== null && v !== undefined);
        }
        // For percentage and time metrics, use average aggregation
        else {
            values = dataPoints.map((dp) => dp.average || 0).filter((v) => v !== null && v !== undefined);
        }

        if (values.length === 0) return;

        // Calculate statistics
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const total = values.reduce((a, b) => a + b, 0);

        // Determine if this is an app service metric (sites/)
        const isAppService = resourceId.includes('/microsoft.web/sites/');
        const isAppServicePlan = resourceId.includes('/microsoft.web/serverfarms/');

        // Map to our structure with per-resource tracking
        if (isAppService) {
            // Initialize app service if not exists
            if (!aggregated.appServices[resourceName]) {
                aggregated.appServices[resourceName] = {
                    name: resourceName,
                    httpResponseTime: { avg: 0, max: 0, min: 0 },
                    requests: { total: 0 },
                    http5xx: { total: 0 },
                };
            }

            switch (metricLower) {
                case 'httpresponsetime':
                    // Convert from seconds to milliseconds if needed
                    const avgMs = avg < 1 ? avg * 1000 : avg;
                    const maxMs = max < 1 ? max * 1000 : max;
                    const minMs = min < 1 ? min * 1000 : min;
                    aggregated.appServices[resourceName].httpResponseTime = {
                        avg: avgMs.toFixed(2),
                        max: maxMs.toFixed(2),
                        min: minMs.toFixed(2),
                    };
                    break;
                case 'requests':
                    aggregated.appServices[resourceName].requests = { total: Math.round(total) };
                    break;
                case 'http5xx':
                    aggregated.appServices[resourceName].http5xx = { total: Math.round(total) };
                    break;
            }
        } else if (isAppServicePlan) {
            // App Service Plan metrics
            switch (metricLower) {
                case 'cpupercentage':
                    aggregated.appServicePlan.cpuPercentage = { avg: avg.toFixed(2), max: max.toFixed(2), min: min.toFixed(2) };
                    break;
                case 'memorypercentage':
                    aggregated.appServicePlan.memoryPercentage = { avg: avg.toFixed(2), max: max.toFixed(2), min: min.toFixed(2) };
                    break;
            }
        } else {
            // Database and Storage metrics
            switch (metricLower) {
                case 'cpu_percent':
                    aggregated.database.cpuPercent = { avg: avg.toFixed(2), max: max.toFixed(2), min: min.toFixed(2), sum: total.toFixed(2) };
                    break;
                case 'connection_failed':
                    aggregated.database.connectionsFailed = { total: Math.round(total) };
                    break;
                case 'deadlock':
                    aggregated.database.deadlocks = { total: Math.round(total) };
                    break;
                case 'availability':
                    aggregated.storage.availability = { avg: avg.toFixed(2) };
                    break;
                case 'successe2elatency':
                    aggregated.storage.successE2ELatency = { avg: avg.toFixed(2) };
                    break;
                case 'successserverlatency':
                    aggregated.storage.successServerLatency = { avg: avg.toFixed(2) };
                    break;
            }
        }
    });

    return aggregated;
}

/**
 * Fetch all Azure metrics for a test run
 * @param {string} testRunId - Azure Load Test run ID
 * @param {Object} config - Configuration object with Azure settings
 * @returns {Promise<Object|null>} Metrics data or null on error
 */
export async function fetchAzureMetrics(testRunId, config) {
    // Validate Azure configuration
    if (!config || !config.azure) {
        console.error('❌ Azure configuration is required');
        return null;
    }

    const azureConfig = config.azure;

    if (!azureConfig.loadTestDataPlaneUri) {
        console.error('❌ Azure loadTestDataPlaneUri is required in configuration');
        return null;
    }

    console.log('🔐 Authenticating with Azure...');
    // Get token for Azure Load Testing data plane
    const loadTestToken = await getAccessToken('https://cnt-prod.loadtesting.azure.com');
    // Get token for Azure Monitor (management plane)
    const managementToken = await getAccessToken('https://management.azure.com/');

    if (!loadTestToken || !managementToken) {
        console.error('❌ Failed to get Azure access token');
        return null;
    }

    console.log('✅ Authenticated successfully\n');

    try {
        // Get test run details
        const testRunDetails = await getTestRunDetails(testRunId, azureConfig.loadTestDataPlaneUri, loadTestToken);
        console.log(`✅ Test run details retrieved: ${testRunDetails.status || 'Unknown'}\n`);

        // Get server-side metrics from Azure Load Testing API
        let serverMetrics = null;
        try {
            serverMetrics = await getTestRunServerMetrics(testRunId, azureConfig.loadTestDataPlaneUri, loadTestToken);
            console.log('✅ Server-side metrics configuration retrieved\n');
        } catch (error) {
            console.warn('⚠️  Could not fetch server metrics from Load Testing API:', error.message);
            console.log('   Falling back to Azure Monitor API...\n');
        }

        // Get timespan from test run
        const startTime = testRunDetails.startDateTime;
        const endTime = testRunDetails.endDateTime;
        const timespan = `${startTime}/${endTime}`;

        // Fetch metrics from Azure Monitor for each app component (from config)
        const appComponents = azureConfig.appComponents || [];

        if (appComponents.length === 0) {
            console.warn('⚠️  No app components configured. Skipping Azure Monitor metrics.');
        }

        const metricsData = [];
        for (let i = 0; i < appComponents.length; i++) {
            const component = appComponents[i];
            try {
                const metrics = await getAzureMonitorMetrics(component.resourceId, component.metrics, timespan, managementToken);
                metricsData.push(metrics);
                const displayName = component.name || component.resourceId.split('/').pop();
                console.log(`✅ Metrics retrieved for: ${displayName}`);

                // Add delay between requests to avoid rate limiting (except for last request)
                if (i < appComponents.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            } catch (error) {
                const displayName = component.name || component.resourceId.split('/').pop();
                console.warn(`⚠️  Could not fetch metrics for ${displayName}:`, error.message);
            }
        }

        // Aggregate all metrics
        const aggregated = aggregateMetrics({ value: metricsData.flatMap((m) => m.value || []) });

        const result = {
            testRunId,
            testRunDetails: {
                status: testRunDetails.status,
                startDateTime: testRunDetails.startDateTime,
                endDateTime: testRunDetails.endDateTime,
                duration: testRunDetails.duration,
                virtualUsers: testRunDetails.vusers,
            },
            serverMetrics: aggregated,
            timestamp: new Date().toISOString(),
        };

        console.log('\n✅ All metrics fetched successfully!\n');
        return result;
    } catch (error) {
        console.error('❌ Error fetching Azure metrics:', error.message);
        return null;
    }
}
