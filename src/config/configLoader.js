/**
 * Configuration Loader
 * 
 * Loads configuration from config.js file, environment variables, or uses defaults
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
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

  // Helper function to safely resolve and import config
  async function loadConfigFile(filePath) {
    try {
      // Resolve path - handle both absolute and relative paths
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      
      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        return null;
      }
      
      // Use file:// URL for proper path handling (especially with spaces)
      // pathToFileURL automatically handles URL encoding
      const fileUrl = pathToFileURL(resolvedPath).href;
      const configModule = await import(fileUrl);
      return configModule.default || configModule;
    } catch (error) {
      // If file:// URL import fails, try direct import as fallback
      try {
        const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        const configModule = await import(resolvedPath);
        return configModule.default || configModule;
      } catch (fallbackError) {
        throw error; // Throw original error
      }
    }
  }

  // Try to find config file
  if (configPath) {
    try {
      const loaded = await loadConfigFile(configPath);
      if (loaded) {
        userConfig = loaded;
        console.log(`   ✓ Configuration loaded from: ${configPath}`);
      } else {
        console.warn(`⚠️  Config file not found: ${configPath}`);
      }
    } catch (error) {
      console.warn(`⚠️  Error loading config from ${configPath}:`, error.message);
    }
  } else {
    // Try to find config.js in current working directory
    const cwdConfigPath = path.join(process.cwd(), 'config.js');
    try {
      const loaded = await loadConfigFile(cwdConfigPath);
      if (loaded) {
        userConfig = loaded;
        console.log(`   ✓ Configuration loaded from: config.js`);
      }
    } catch (error) {
      // Silent fail - will use defaults
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
  
  // Arrays that should be replaced entirely (not merged)
  const replaceArrays = ['userTypes', 'appComponents', 'jmxThreadGroupNames', 'threadGroupPatterns', 'fallbackModels'];
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key])) {
        // Replace arrays entirely if they're in the replace list, or if target doesn't have this key
        if (replaceArrays.includes(key) || !Array.isArray(target[key])) {
          output[key] = source[key];
        } else {
          // For other arrays, concatenate (though most should be replaced)
          output[key] = source[key];
        }
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
