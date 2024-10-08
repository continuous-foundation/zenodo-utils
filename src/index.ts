import type { AxiosInstance } from 'axios';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export interface Creator {
  name: string;
  affiliation?: string;
  orcid?: string;
  gnd?: string;
}

export enum UploadType {
  /* publication */
  'publication' = 'publication',
  /* poster */
  poster = 'poster',
  /* presentation */
  presentation = 'presentation',
  /* dataset */
  dataset = 'dataset',
  /* image */
  image = 'image',
  /* video/audio */
  video = 'video',
  /* software */
  software = 'software',
  /* lesson */
  lesson = 'lesson',
  /* physical object */
  physicalobject = 'physicalobject',
  other = 'other',
}

export enum AccessRight {
  /* Open Access, the default */
  open = 'open',
  /* Embargoed Access */
  embargoed = 'embargoed',
  /* Restricted Access */
  restricted = 'restricted',
  /* Closed Access */
  closed = 'closed',
}

export interface DepositionMetadata {
  upload_type: UploadType;
  publication_date: string;
  title: string;
  creators: Creator[];
  description: string;
  access_right?: AccessRight;
  license?: string;
  doi?: string;
  [key: string]: any; // For additional optional fields
}

export class ZenodoClient {
  private accessToken: string;
  private axiosInstance: AxiosInstance;
  private baseURL: string = 'https://zenodo.org/api';

  constructor(accessToken: string | undefined, sandbox: boolean = false) {
    if (!accessToken) {
      throw new Error('Cannot connect to zenodo without an access token.');
    }
    this.accessToken = accessToken;
    if (sandbox) {
      this.baseURL = 'https://sandbox.zenodo.org/api';
    }
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      params: {
        access_token: this.accessToken,
      },
    });
  }

  /**
   * Create a new deposition with the provided metadata.
   * @param metadata Deposition metadata
   */
  public async createDeposition(metadata: DepositionMetadata): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/deposit/depositions',
        { metadata },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Upload a file to an existing deposition.
   * @param depositionId ID of the deposition
   * @param filePath Path to the file to upload
   */
  public async uploadFile(depositionId: number, filePath: string): Promise<any> {
    try {
      // Get the deposition to retrieve the bucket URL
      const deposition = await this.axiosInstance.get(`/deposit/depositions/${depositionId}`);
      const bucketUrl: string = deposition.data.links.bucket;

      // Step 2: Prepare the file for upload
      const fileName = path.basename(filePath);
      const url = `${bucketUrl}/${encodeURIComponent(fileName)}`;

      const fileStream = fs.createReadStream(filePath);

      // Step 3: Calculate the file size
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;

      // Step 4: Set the appropriate headers and config
      const response = await axios.put(url, fileStream, {
        headers: {
          'Content-Type': 'application/octet-stream', // or the actual MIME type of your file
          'Content-Length': fileSizeInBytes,
        },
        params: {
          access_token: this.accessToken,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * List all files in an unpublished deposition.
   * @param depositionId ID of the deposition
   */
  public async listFiles(depositionId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/deposit/depositions/${depositionId}/files`);
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Publish a deposition.
   * @param depositionId ID of the deposition
   */
  public async publishDeposition(depositionId: number): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        `/deposit/depositions/${depositionId}/actions/publish`,
      );
      return response.data;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Handle API errors.
   * @param error Error object
   */
  private handleError(error: any): void {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      throw new Error(`API Error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('Error:', error.message);
      throw new Error(`Error: ${error.message}`);
    }
  }
}
