/**
 * Unified Report Generator - Main Entry Point
 *
 * @module unified-report-generator
 */

export { generateUnifiedReport, generateStandaloneUnifiedReport } from './src/generateUnifiedReport.js';
export { fetchAzureMetrics } from './src/fetchAzureMetrics.js';
export { generateAIAnalysis } from './src/generateAIAnalysis.js';
export { loadConfiguration } from './src/config/configLoader.js';
export { defaultConfig } from './src/config/defaultConfig.js';
