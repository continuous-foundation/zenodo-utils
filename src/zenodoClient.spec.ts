import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZenodoClient } from './index.js';
import axios from 'axios';

// Mock axios module
vi.mock('axios');

describe('ZenodoClient Tests', () => {
  let zenodoClient: ZenodoClient;
  const ACCESS_TOKEN = 'fake_access_token';

  beforeEach(() => {
    // Mock axiosInstance.post to return the mock response
    (axios.create as Mock).mockReturnValue({});
    // Instantiate the ZenodoClient with the fake access token
    zenodoClient = new ZenodoClient(ACCESS_TOKEN, true); // Use sandbox environment for testing
  });

  it('should instantiate ZenodoClient correctly', () => {
    expect(zenodoClient).toBeInstanceOf(ZenodoClient);
  });
});
