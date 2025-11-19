// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Polyfill Request and Response for Node.js test environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
    
    get(key) {
      return this.headers.get(key) || null;
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || '';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value);
        });
      }
    }
  };
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers extends Map {
    constructor(init) {
      super();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    }
  };
}
