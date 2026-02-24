// API Configuration
// This file centralizes API configuration for easy switching between environments

// Environment-based configuration
const getApiConfig = () => {
  // Check for environment variables first
  if (process.env.REACT_APP_API_URL) {
    return {
      baseUrl: process.env.REACT_APP_API_URL,
      type: process.env.REACT_APP_API_TYPE || 'lambda-url'
    };
  }

  // Default configurations
  const configs = {
    development: {
      // Use API Gateway for development
      baseUrl: process.env.REACT_APP_API_GATEWAY_URL || 'https://your-api-gateway-url.amazonaws.com/prod',
      type: 'api-gateway'
    },
    production: {
      // Use API Gateway for production
      baseUrl: process.env.REACT_APP_API_GATEWAY_URL || 'https://your-api-gateway-url.amazonaws.com/prod',
      type: 'api-gateway'
    },
    lambda: {
      // Fallback to Lambda Function URL
      baseUrl: 'https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws',
      type: 'lambda-url'
    }
  };

  // Determine environment
  const env = process.env.NODE_ENV || 'development';
  return configs[env] || configs.development;
};

const config = getApiConfig();

export const API_CONFIG = {
  BASE_URL: config.baseUrl,
  TYPE: config.type,
  ENDPOINTS: {
    TODOS: '/todos',
    TODO: (id) => `/todos/${id}`
  },
  HEADERS: {
    'Content-Type': 'application/json',
  },
  CORS_MODE: 'cors',
  CREDENTIALS: 'omit'
};

// Utility function to build full API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Error handling utilities
export const handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }

    // Provide more helpful error messages for common issues
    if (response.status === 0) {
      throw new Error('Network error. This is likely a CORS or connectivity issue.');
    } else if (response.status === 403) {
      throw new Error('Access forbidden. Please check API Gateway CORS configuration.');
    } else if (response.status === 404) {
      throw new Error('API endpoint not found. Please verify the API Gateway URL.');
    } else if (response.status >= 500) {
      throw new Error(`Server error: ${errorMessage}`);
    } else {
      throw new Error(errorMessage);
    }
  }
  
  return response;
};

// Request configuration for different API types
export const getRequestConfig = (method = 'GET', body = null) => {
  const config = {
    method,
    mode: API_CONFIG.CORS_MODE,
    credentials: API_CONFIG.CREDENTIALS,
    headers: { ...API_CONFIG.HEADERS }
  };

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return config;
};