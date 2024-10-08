import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DepositionMetadata } from './index.js';
import { AccessRight, UploadType, ZenodoClient } from './index.js';
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

  it('should create a deposition', async () => {
    // Mock response data
    const mockDepositionResponse = {
      data: {
        id: 123456,
        metadata: {
          title: 'Test Deposition',
        },
        links: {
          bucket: 'https://sandbox.zenodo.org/api/files/fake-bucket-id',
        },
      },
    };

    (zenodoClient as any).axiosInstance = {
      post: vi.fn().mockResolvedValue(mockDepositionResponse),
    };

    const metadata: DepositionMetadata = {
      upload_type: UploadType.presentation,
      publication_date: '2023-10-10',
      title: 'Test Presentation',
      creators: [{ name: 'Doe, John' }],
      description: 'A test deposition.',
      access_right: AccessRight.open,
    };

    const deposition = await zenodoClient.createDeposition(metadata);

    expect(deposition).toEqual(mockDepositionResponse.data);
  });
});
