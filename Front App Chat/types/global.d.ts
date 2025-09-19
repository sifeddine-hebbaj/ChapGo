// Global type declarations for the chat application

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      EXPO_PUBLIC_API_URL?: string;
    }
  }
}

// Extend the global Window interface for web-specific features
declare global {
  interface Window {
    __EXPO_ENV__?: string;
  }
}

// React Native specific globals
declare global {
  var __DEV__: boolean;
  var __EXPO_ENV__: string;
}

// Ensure this file is treated as a module
export {};
