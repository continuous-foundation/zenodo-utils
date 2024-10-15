import type { AxiosInstance } from 'axios';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * The creators/authors of the deposition. Each array element is an object with the attributes:
 *
 * - name: Name of creator in the format Family name, Given names
 * - affiliation: Affiliation of creator (optional).
 * - orcid: ORCID identifier of creator (optional).
 * - gnd: GND identifier of creator (optional).
 *
 * **Example:**
 *
 * ```json
 * [
 *    {'name':'Doe, John', 'affiliation': 'Zenodo'},
 *    {'name':'Smith, Jane', 'affiliation': 'Zenodo', 'orcid': '0000-0002-1694-233X'},
 *    {'name': 'Kowalski, Jack', 'affiliation': 'Zenodo', 'gnd': '170118215'}
 * ]
 * ```
 */
export type Creator = {
  /** Name of creator in the format Family name, Given names */
  name: string;
  /** Affiliation of creator (optional). */
  affiliation?: string;
  /** ORCID identifier of creator (optional). */
  orcid?: string;
  /** GND identifier of creator (optional). */
  gnd?: string;
};

export type ContributorType =
  | 'ContactPerson'
  | 'DataCollector'
  | 'DataCurator'
  | 'DataManager'
  | 'Distributor'
  | 'Editor'
  | 'HostingInstitution'
  | 'Producer'
  | 'ProjectLeader'
  | 'ProjectManager'
  | 'ProjectMember'
  | 'RegistrationAgency'
  | 'RegistrationAuthority'
  | 'RelatedPerson'
  | 'Researcher'
  | 'ResearchGroup'
  | 'RightsHolder'
  | 'Supervisor'
  | 'Sponsor'
  | 'WorkPackageLeader'
  | 'Other';

export type Contributor = {
  /**
   * The contributors of the deposition. Each array element includes:
   *
   * - name: Name of the contributor in the format "Family name, Given names".
   * - type: Type of contributor based on a controlled vocabulary (e.g., "Editor").
   * - affiliation: Optional affiliation of the contributor.
   * - orcid: Optional ORCID identifier.
   * - gnd: Optional GND identifier.
   *
   * **Example:**
   * ```json
   * [
   *   {"name":"Doe, John", "affiliation": "Zenodo", "type": "Editor" },
   *   {"name":"Smith, Jane", "affiliation": "Zenodo", "type": "DataCurator", "orcid": "0000-0002-1694-233X"}
   * ]
   * ```
   */
  name: string;
  type: ContributorType;
  affiliation?: string;
  orcid?: string;
  gnd?: string;
};

export type UploadType =
  /* publication */
  | 'publication'
  /* poster */
  | 'poster'
  /* presentation */
  | 'presentation'
  /* dataset */
  | 'dataset'
  /* image */
  | 'image'
  /* video/audio */
  | 'video'
  /* software */
  | 'software'
  /* lesson */
  | 'lesson'
  /* physical object */
  | 'physicalobject'
  | 'other';

export type Community = {
  /**
   * Communities where the deposition appears. Each community object must include:
   *
   * - `identifier`: Unique community identifier.
   *
   * **Example:**
   *
   * ```json
   * [
   *   {"identifier":"ecfunded"}
   * ]
   * ```
   */
  identifier: string;
};

export type AccessRight =
  /* Open Access, the default */
  | 'open'
  /* Embargoed Access */
  | 'embargoed'
  /* Restricted Access */
  | 'restricted'
  /* Closed Access */
  | 'closed';

export type PublicationType =
  /* Annotation collection */
  | 'annotationcollection'
  /* Book */
  | 'book'
  /* Book section */
  | 'section'
  /* Conference paper */
  | 'conferencepaper'
  /* Data management plan */
  | 'datamanagementplan'
  /* Journal article */
  | 'article'
  /* Patent */
  | 'patent'
  /* Preprint */
  | 'preprint'
  /* Project deliverable */
  | 'deliverable'
  /* Project milestone */
  | 'milestone'
  /* Proposal */
  | 'proposal'
  /* Report */
  | 'report'
  /* Software documentation */
  | 'softwaredocumentation'
  /* Taxonomic treatment */
  | 'taxonomictreatment'
  /* Technical note */
  | 'technicalnote'
  /* Thesis */
  | 'thesis'
  /* Working paper */
  | 'workingpaper'
  /* Other */
  | 'other';

export type ImageType = 'figure' | 'plot' | 'drawing' | 'diagram' | 'photo' | 'other';

export type Subject = {
  /** Term from taxonomy or controlled vocabulary. */
  term: string;
  /** Unique identifier for term. */
  identifier: string;
  /** Persistent identifier scheme for id (automatically detected). */
  scheme?: string;
};

/**
 * Location.
 *
 * **Example:**
 *
 * ```json
 * [
 *    {"lat": 34.02577, "lon": -118.7804, "place": "Los Angeles"}
 *    {"place": "Mt.Fuji, Japan", "description": "Sample found 100ft from the foot of the mountain."}
 * ]
 * ```
 */
export type Location = {
  /** lat (double): latitude */
  lat?: number;
  /** lon (double): longitude */
  lon?: number;
  /** place (string): place’s name (required) */
  place: string;
  /** description (string): place’s description (optional) */
  description?: string;
};

/**
 * List of date intervals
 *
 * Note that you have to specify at least a start or end date.
 * For an exact date, use the same value for both start and end.
 *
 * **Example:**
 * ```json
 * [
 *    {"start": "2018-03-21", "end": "2018-03-25", "type": "Collected", "description": "Specimen A5 collection period."}
 * ]
 * ```
 */
export type DateInterval = {
  /** start (ISO date string): start date */
  start?: string;
  /** end (ISO date string): end date */
  end?: string;
  /** type (Collected, Valid, Withdrawn): The interval’s type (required) */
  type: 'Collected' | 'Valid' | 'Withdrawn';
  /** The interval’s description (optional) */
  description?: string;
};

export interface DepositionMetadata {
  upload_type: UploadType;
  /** Required if `upload_type` is "publication" */
  publication_type?: PublicationType;
  /** Required if `upload_type` is "image" */
  image_type?: ImageType;
  /** Date of publication in ISO8601 format (YYYY-MM-DD). Defaults to current date. */
  publication_date?: string;
  /** Title of deposition. */
  title: string;
  /**
   * The creators/authors of the deposition. Each array element is an object with the attributes:
   *  - name: Name of creator in the format Family name, Given names
   *  - affiliation: Affiliation of creator (optional).
   *  - orcid: ORCID identifier of creator (optional).
   *  - gnd: GND identifier of creator (optional).
   *
   * **Example:**
   *
   * ```json
   * [
   *    {"name":"Doe, John", "affiliation": "Zenodo"},
   *    {"name":"Smith, Jane", "affiliation": "Zenodo", "orcid": "0000-0002-1694-233X"},
   *    {"name": "Kowalski, Jack", "affiliation": "Zenodo", "gnd": "170118215"}
   * ]
   * ```
   */
  creators: Creator[];
  /** Abstract or description for deposition. */
  description: string;
  /**
   * Controlled vocabulary:
   *
   *  - open: Open Access
   *  - embargoed: Embargoed Access
   *  - restricted: Restricted Access
   *  - closed: Closed Access
   *
   *  Defaults to open.
   */
  access_right?: AccessRight;
  /**
   * Controlled vocabulary:
   * The selected license applies to all files in this deposition,
   * but not to the metadata which is licensed under Creative Commons Zero.
   * You can find the available license IDs via our /api/licenses endpoint.
   * Defaults to cc-zero for datasets and cc-by for everything else.
   */
  license?: string;
  /** When the deposited files will be made automatically made publicly available by the system. Defaults to current date. */
  embargo_date?: string;
  /** Specify the conditions under which you grant users access to the files in your upload. User requesting access will be asked to justify how they fulfil the conditions. Based on the justification, you decide who to grant/deny access. You are not allowed to charge users for granting access to data hosted on Zenodo. */
  access_conditions?: string;
  /**
   * Digital Object Identifier. Did a publisher already assign a DOI to your
   * deposited files? If not, leave the field empty and we will register
   * a new DOI for you when you publish. A DOI allow others to easily
   * and unambiguously cite your deposition.
   */
  doi?: string;

  /**
   * Set to `true`, to reserve a Digital Object Identifier (DOI).
   * The DOI is automatically generated by our system and cannot be changed.
   * Also, The DOI is not registered with DataCite until you publish your deposition,
   * and thus cannot be used before then. Reserving a DOI is useful,
   * if you need to include it in the files you upload, or if you need to
   * provide a dataset DOI to your publisher but not yet publish your dataset.
   * The response from the REST API will include the reserved DOI.
   */
  prereserve_doi?: boolean | { doi: string };

  /**  Free form keywords for this deposition.
   *
   * **Example:**
   *
   * ```json
   * ["Keyword 1", "Keyword 2"]
   * ```
   */
  keywords?: string[];
  /** Additional notes. */
  notes?: string;

  /**
   * List of contributors for the deposition.
   */
  contributors?: Contributor[];

  /**
   * List of references for the deposition.
   *
   * **Example:**
   *
   * ```json
   * ["Doe J (2014). Title. Publisher. DOI", "Smith J (2014). Title. Publisher. DOI"]
   * ```
   */
  references?: string[];

  /**
   * List of communities you wish the deposition to appear.
   * The owner of the community will be notified, and can either accept or
   * reject your request.
   *
   * Each array element is an object with the attributes:
   *
   * - `identifier`: Community identifier
   *
   * **Example:**
   *
   * ```json
   * [{'identifier':'ecfunded'}]
   * ```
   */
  communities?: Community[];

  /**
   * List of OpenAIRE-supported grants, which have funded the research for this deposition.
   * Each array element is an object with the attributes:
   *
   * - `id`: grant ID.
   *
   * **Example:**
   *
   * (European Commission grants only):
   *
   * ```json
   * [{'id':'283595'}]
   * ```
   *
   * or funder DOI-prefixed (All grants, recommended):
   *
   * ```json
   * [{'id': '10.13039/501100000780::283595'}]
   * ```
   *
   * Accepted funder DOI prefixes:
   *
   * - Academy of Finland: `10.13039/501100002341`
   * - Agence Nationale de la Recherche: `10.13039/501100001665`
   * - Aligning Science Across Parkinson’s: `10.13039/100018231`
   * - Australian Research Council: `10.13039/501100000923`
   * - Austrian Science Fund: `10.13039/501100002428`
   * - Canadian Institutes of Health Research: `10.13039/501100000024`
   * - European Commission: `10.13039/501100000780`
   * - European Environment Agency: `10.13039/501100000806`
   * - Fundação para a Ciência e a Tecnologia: `10.13039/501100001871`
   * - Hrvatska Zaklada za Znanost: `10.13039/501100004488`
   * - Institut National Du Cancer: `10.13039/501100006364`
   * - Ministarstvo Prosvete, Nauke i Tehnološkog Razvoja: `10.13039/501100004564`
   * - Ministarstvo Znanosti, Obrazovanja i Sporta: `10.13039/501100006588`
   * - National Health and Medical Research Council: `10.13039/501100000925`
   * - National Institutes of Health: `10.13039/100000002`
   * - National Science Foundation: `10.13039/100000001`
   * - Natural Sciences and Engineering Research Council of Canada: `10.13039/501100000038`
   * - Nederlandse Organisatie voor Wetenschappelijk Onderzoek: `10.13039/501100003246`
   * - Research Councils: `10.13039/501100000690`
   * - Schweizerischer Nationalfonds zur Förderung der wissenschaftlichen Forschung: `10.13039/501100001711`
   * - Science Foundation Ireland: `10.13039/501100001602`
   * - Social Science Research Council: `10.13039/100001345`
   * - Templeton World Charity Foundation: `10.13039/501100011730`
   * - Türkiye Bilimsel ve Teknolojik Araştırma Kurumu: `10.13039/501100004410`
   * - UK Research and Innovation: `10.13039/100014013`
   * - Wellcome Trust: `10.13039/100004440`
   */
  grants?: { id: string }[];

  /**
   * Title of the journal, if the deposition is a published article.
   */
  journal_title?: string;

  /**
   * Volume of the journal, if the deposition is a published article.
   */
  journal_volume?: string;

  /**
   * Issue of the journal, if the deposition is a published article.
   */
  journal_issue?: string;

  /**
   * Pages of the journal, if the deposition is a published article.
   */
  journal_pages?: string;

  /**
   * Title of conference (e.g. 20th International Conference on Computing in High Energy and Nuclear Physics).
   */
  conference_title?: string;

  /**
   * 	Acronym of conference (e.g. CHEP'13).
   */
  conference_acronym?: string;

  /**
   * Dates of conference (e.g. 14-18 October 2013). Conference title or acronym must also be specified if this field is specified.
   */
  conference_dates?: string;

  /**
   * Place of conference in the format city, country (e.g. Amsterdam, The Netherlands). Conference title or acronym must also be specified if this field is specified.
   */
  conference_place?: string;

  /**
   * URL of conference (e.g. http://www.chep2013.org/).
   */
  conference_url?: string;

  /**
   * Number of session within the conference (e.g. VI).
   */
  conference_session?: string;

  /**
   * Number of part within a session (e.g. 1).
   */
  conference_session_part?: string;

  /**
   * Publisher of a book/report/chapter
   */
  imprint_publisher?: string;

  /**
   * ISBN of a book/report
   */
  imprint_isbn?: string;

  /**
   * Place of publication of a book/report/chapter in the format city, country.
   */
  imprint_place?: string;

  /**
   * Title of book for chapters
   */
  partof_title?: string;

  /**
   * Page numbers of the book.
   */
  partof_pages?: string;

  /**
   * Supervisors of the thesis. Same format as for creators.
   */
  thesis_supervisors?: Creator[];

  /**
   * Awarding university of thesis.
   */
  thesis_university?: string;

  /**
   * Specify subjects from a taxonomy or controlled vocabulary.
   * Each term must be uniquely identified (e.g. a URL).
   * For free form text, use the keywords field.
   * Each array element is an object with the attributes:
   *
   *  - `term`: Term from taxonomy or controlled vocabulary.
   *  - `identifier`: Unique identifier for term.
   *  - `scheme`: Persistent identifier scheme for id (automatically detected).
   *
   * **Example:**
   *
   * ```json
   * [
   *    {"term": "Astronomy", "identifier": "http://id.loc.gov/authorities/subjects/sh85009003", "scheme": "url"}
   * ]
   * ```
   */
  subjects?: Subject[];

  /**
   * Version of the resource. Any string will be accepted, however the suggested format is a semantically versioned tag (see more details on semantic versioning at semver.org)
   * Example: `2.1.5`
   */
  version?: string;

  /**
   * Specify the main language of the record as ISO 639-2 or 639-3 code, see Library of Congress ISO 639 codes list.
   * **Example:** `eng`
   */
  language?: string;

  /**
   * List of locations related to the record.
   */
  locations?: Location[];

  /**
   * List of date intervals related to the record.
   */
  dates?: DateInterval[];

  /**
   * The methodology employed for the study or research.
   */
  method?: string;

  /**
   * custom metadata, not exposed
   */
  custom?: {
    'code:codeRepository'?: string;
    'code:programmingLanguage'?: { id: string; title: { en: string } }[];
  };
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
   * Create a new deposition with the provided metadata.
   * @param metadata Deposition metadata
   */
  public async updateDeposition(depositionId: number, metadata: DepositionMetadata): Promise<any> {
    try {
      const response = await this.axiosInstance.put(
        `/deposit/depositions/${depositionId}`,
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
