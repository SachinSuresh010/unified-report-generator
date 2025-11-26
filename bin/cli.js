#!/usr/bin/env node

/**
 * Unified Report Generator CLI
 * 
 * Command-line interface for generating unified performance reports
 */

// Load environment variables from .env file FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { generateUnifiedReport, generateStandaloneUnifiedReport } from '../src/generateUnifiedReport.js';
import { loadConfiguration } from '../src/config/configLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        config: null,
        standalone: false,
        automation: null, // null = use config, true/false = override
        aiAnalysis: null, // null = use config, true/false = override
        output: null,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--config' || arg === '-c') {
            if (i + 1 < args.length) {
                options.config = args[++i];
            }
        } else if (arg === '--standalone' || arg === '-s') {
            options.standalone = true;
        } else if (arg === '--no-automation') {
            options.automation = false;
        } else if (arg === '--enable-automation') {
            options.automation = true;
        } else if (arg === '--no-ai-analysis') {
            options.aiAnalysis = false;
        } else if (arg === '--enable-ai-analysis') {
            options.aiAnalysis = true;
        } else if (arg === '--output' || arg === '-o') {
            if (i + 1 < args.length) {
                options.output = args[++i];
            }
        }
    }

    return options;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
Unified Report Generator

Usage:
  unified-report [options]

Options:
  --config, -c <path>          Path to configuration file (default: config.js in current directory)
  --standalone, -s              Generate standalone HTML report (all data embedded)
  --no-automation               Disable Playwright/automation sections (overrides config)
  --enable-automation           Enable Playwright/automation sections (overrides config)
  --no-ai-analysis              Disable AI analysis (overrides config)
  --enable-ai-analysis          Enable AI analysis (overrides config)
  --output, -o <dir>            Output directory (overrides config.outputDir, default: .artifacts/unified-report)
  --help, -h                    Show this help message

Examples:
  unified-report
  unified-report --standalone
  unified-report --config ./my-config.js --no-automation
  unified-report --output ./reports --enable-ai-analysis

Configuration:
  Create a config.js file in your project root or specify with --config.
  See config.example.js for configuration options.
`);
}

/**
 * Main CLI function
 */
async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        process.exit(0);
    }

    try {
        // Load configuration
        console.log('📋 Loading configuration...\n');
        const config = await loadConfiguration(options.config);

        // Apply CLI overrides
        if (options.automation !== null) {
            if (!config.features) {
                config.features = {};
            }
            config.features.automation = options.automation;
            console.log(`   Automation: ${options.automation ? 'enabled' : 'disabled'} (CLI override)\n`);
        }

        if (options.aiAnalysis !== null) {
            if (!config.features) {
                config.features = {};
            }
            config.features.aiAnalysis = options.aiAnalysis;
            console.log(`   AI Analysis: ${options.aiAnalysis ? 'enabled' : 'disabled'} (CLI override)\n`);
        }

        // Determine output directory: CLI flag > config > default
        const outputDir = options.output || config.outputDir || '.artifacts/unified-report';
        
        // Generate report
        const reportOptions = {
            config,
            outputDir: outputDir,
        };

        let success;
        if (options.standalone) {
            success = await generateStandaloneUnifiedReport(reportOptions);
        } else {
            success = await generateUnifiedReport(reportOptions);
        }

        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run CLI
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
