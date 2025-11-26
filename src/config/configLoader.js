/**
 * Configuration Loader
 * 
 * Loads configuration from config.js file, environment variables, or uses defaults
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultConfig } from './defaultConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load configuration from file or use defaults
 * @param {string} configPath - Optional path to config file
 * @returns {Promise<Object>} Merged configuration object
 */
export async function loadConfiguration(configPath = null) {
  let userConfig = {};

  // Try to find config file
  if (configPath) {
    // Use provided path
    if (fs.existsSync(configPath)) {
      try {
        const configModule = await import(path.resolve(configPath));
        userConfig = configModule.default || configModule;
      } catch (error) {
        console.warn(`⚠️  Error loading config from ${configPath}:`, error.message);
      }
    } else {
      console.warn(`⚠️  Config file not found: ${configPath}`);
    }
  } else {
    // Try to find config.js in current working directory
    const cwdConfigPath = path.join(process.cwd(), 'config.js');
    if (fs.existsSync(cwdConfigPath)) {
      try {
        const configModule = await import(cwdConfigPath);
        userConfig = configModule.default || configModule;
      } catch (error) {
        console.warn(`⚠️  Error loading config from ${cwdConfigPath}:`, error.message);
      }
    }
  }

  // Merge with defaults
  const config = deepMerge(defaultConfig, userConfig);

  // Override AI API key from environment variable if not set in config
  if (!config.ai.apiKey && process.env.GEMINI_API_KEY) {
    config.ai.apiKey = process.env.GEMINI_API_KEY;
  }

  // Override Azure settings from environment variables if not set in config
  if (!config.azure.subscriptionId && process.env.AZURE_SUBSCRIPTION_ID) {
    config.azure.subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
  }
  if (!config.azure.resourceGroup && process.env.AZURE_RESOURCE_GROUP) {
    config.azure.resourceGroup = process.env.AZURE_RESOURCE_GROUP;
  }
  if (!config.azure.loadTestResource && process.env.AZURE_LOAD_TEST_RESOURCE) {
    config.azure.loadTestResource = process.env.AZURE_LOAD_TEST_RESOURCE;
  }
  if (!config.azure.loadTestDataPlaneUri && process.env.AZURE_LOAD_TEST_DATA_PLANE_URI) {
    config.azure.loadTestDataPlaneUri = process.env.AZURE_LOAD_TEST_DATA_PLANE_URI;
  }

  return config;
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key])) {
        output[key] = Array.isArray(target[key]) 
          ? [...target[key], ...source[key]] 
          : source[key];
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
