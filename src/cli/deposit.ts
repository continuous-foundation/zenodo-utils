import path from 'node:path';
import fs from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import { Command, Option } from 'commander';
import inquirer from 'inquirer';
import type { UploadType, Contributor as ContributorZ, DepositionMetadata } from '../index.js';
import { ZenodoClient } from '../index.js';
import type { ISession } from 'myst-cli';
import {
  filterPages,
  findCurrentProjectAndLoad,
  getFileContent,
  loadConfig,
  loadProject,
  parseMyst,
  processProject,
  selectors,
  Session,
} from 'myst-cli';
import type { GenericParent } from 'myst-common';
import { extractPart, plural } from 'myst-common';
import { mystToHtml } from 'myst-to-html';
import type { Affiliation, Contributor, ProjectFrontmatter } from 'myst-frontmatter';
import { clirun } from 'myst-cli-utils';
import { addZenodoToConfig } from './utils.js';

type DepositOptions = {
  type?: UploadType;
  file?: string;
  sandbox?: boolean;
};

type DepositSource = {
  projectPath: string;
  depositFile: string;
};

export async function depositArticleFromSource(session: ISession, depositSource: DepositSource) {
  const { projectPath, depositFile } = depositSource;
  const state = session.store.getState();
  const configFile = selectors.selectLocalConfigFile(state, projectPath);
  const projectFrontmatter = selectors.selectLocalProjectConfig(
    session.store.getState(),
    projectPath,
  );
  let abstractPart: GenericParent | undefined;
  let frontmatter: ProjectFrontmatter | undefined;
  const dois: Record<string, string> = {};
  if (depositFile === configFile) {
    const { pages } = await loadProject(session, projectPath);
    const fileContents = await getFileContent(
      session,
      pages.map(({ file }) => file),
      { projectPath, imageExtensions: [] },
    );
    if (projectFrontmatter?.parts?.abstract) {
      abstractPart = parseMyst(session, projectFrontmatter.parts.abstract.join('\n\n'), configFile);
    } else {
      fileContents.forEach(({ mdast }) => {
        if (abstractPart) return;
        abstractPart = extractPart(mdast, 'abstract');
      });
    }
    fileContents.forEach(({ references }) => {
      references.cite?.order.forEach((key) => {
        const value = references.cite?.data[key].doi;
        if (value) dois[key] = value;
        else session.log.warn(`Citation without DOI excluded from zenodo deposit: ${key}`);
      });
    });
    frontmatter = projectFrontmatter;
  } else {
    const [fileContent] = await getFileContent(session, [depositFile], {
      projectPath,
      imageExtensions: [],
    });
    // Prioritize project title over page title
    const title = projectFrontmatter?.title ?? frontmatter?.title;
    // Prioritize project subtitle over page subtitle unless project has no title
    const subtitle = projectFrontmatter?.title
      ? (projectFrontmatter?.subtitle ?? undefined)
      : frontmatter?.subtitle;
    frontmatter = { ...fileContent.frontmatter, title, subtitle };
    abstractPart = extractPart(fileContent.mdast, 'abstract');
    fileContent.references.cite?.order.forEach((key) => {
      const value = fileContent.references.cite?.data[key].doi;
      if (value) dois[key] = value;
      else session.log.warn(`Citation without DOI excluded from zenodo deposit: ${key}`);
    });
  }

  let abstract: string | undefined;
  if (abstractPart) {
    abstract = mystToHtml(abstractPart);
  }
  return {
    frontmatter: frontmatter ?? {},
    dois,
    abstract,
    configFile,
    project: projectFrontmatter,
  };
}

async function getDepositSources(
  session: ISession,
  opts: DepositOptions,
): Promise<DepositSource[]> {
  let depositFile: string;
  let projectPath: string | undefined;
  // If file is specified, find the containing project and use it as the only source
  if (opts.file) {
    depositFile = path.resolve(opts.file);
    projectPath = await findCurrentProjectAndLoad(session, depositFile);
    if (!projectPath) {
      throw new Error(`Unable to determine project path from file: ${opts.file}`);
    }
    return [{ depositFile, projectPath }];
  }
  // If file is not specified and there is a project on the current path, select a single source from there
  await session.reload();
  const state = session.store.getState();
  projectPath = selectors.selectCurrentProjectPath(state);
  const configFile = selectors.selectCurrentProjectFile(state);
  if (projectPath && configFile) {
    const project = await processProject(
      session,
      { path: projectPath },
      {
        imageExtensions: [],
        writeFiles: false,
      },
    );
    const pages = filterPages(project);
    if (pages.length === 0) throw new Error('No MyST pages found');
    const resp = await inquirer.prompt([
      {
        name: 'depositFile',
        type: 'list',
        message: 'File:',
        choices: [{ file: configFile }, ...filterPages(project)].map(({ file }) => {
          return { name: path.relative('.', file), value: file };
        }),
      },
    ]);
    depositFile = resp.depositFile;
    return [{ projectPath, depositFile }];
  }
  // If there is no project on the current path, load all projects in child folders
  const subdirs = fs
    .readdirSync('.')
    .map((item) => path.resolve(item))
    .filter((item) => fs.lstatSync(item).isDirectory());
  const depositSources = (
    await Promise.all(
      subdirs.map(async (dir) => {
        const config = await loadConfig(session, dir);
        if (!config) return;
        return {
          projectPath: dir,
          depositFile: selectors.selectLocalConfigFile(session.store.getState(), dir),
        };
      }),
    )
  ).filter((source): source is DepositSource => !!source);
  return depositSources;
}

function issueDataFromArticles(
  session: ISession,
  articles: { frontmatter: ProjectFrontmatter }[],
  opts: DepositOptions,
) {
  let venueTitle: string | undefined;
  let venueAbbr: string | undefined;
  let venueDoi: string | undefined;
  let venueUrl: string | undefined;
  let volumeNumber: string | undefined;
  let volumeDoi: string | undefined;
  let issueNumber: string | undefined;
  let issueDoi: string | undefined;
  let journalSeries: string | undefined;
  let journalIssn: string | undefined;
  let eventNumber: string | number | undefined;
  let eventDate: string | undefined;
  let eventLocation: string | undefined;
  let volumeTitle: string | undefined;
  let venuePublisher: string | undefined;
  let volumeSubject: string | undefined;
  let publicationEditors:
    | (Omit<Contributor, 'affiliations'> & { affiliations: Affiliation[] })[]
    | undefined;
  articles.forEach(({ frontmatter }) => {
    const { volume, issue, venue, editors, contributors, affiliations } = frontmatter;
    if (venue?.title) {
      if (!venueTitle) {
        venueTitle = venue.title;
      } else if (venueTitle !== venue.title) {
        throw new Error(`Conflicting venue titles: "${venueTitle}" and "${venue.title}"`);
      }
    }
    if (venue?.short_title) {
      if (!venueAbbr) {
        venueAbbr = venue.short_title;
      } else if (venueAbbr !== venue.short_title) {
        throw new Error(
          `Conflicting journal abbreviations: "${venueAbbr}" and "${venue.short_title}"`,
        );
      }
    }
    if (venue?.doi) {
      if (!venueDoi) {
        venueDoi = venue.doi;
      } else if (venueDoi !== venue.doi) {
        throw new Error(`Conflicting journal dois: "${venueDoi}" and "${venue.doi}"`);
      }
    }
    if (venue?.url) {
      if (!venueUrl) {
        venueUrl = venue.url;
      } else if (venueUrl !== venue.url) {
        throw new Error(`Conflicting venue urls: "${venueUrl}" and "${venue.url}"`);
      }
    }
    if (venue?.series) {
      if (!journalSeries) {
        journalSeries = venue.series;
      } else if (journalSeries !== venue.series) {
        throw new Error(`Conflicting series: "${journalSeries}" and "${venue.series}"`);
      }
    }
    if (venue?.issn) {
      if (!journalIssn) {
        journalIssn = venue.issn;
      } else if (journalIssn !== venue.issn) {
        throw new Error(`Conflicting issn: "${journalIssn}" and "${venue.issn}"`);
      }
    }
    if (venue?.number != null) {
      if (!eventNumber) {
        eventNumber = venue.number;
      } else if (eventNumber !== venue.number) {
        throw new Error(`Conflicting event number: "${eventNumber}" and "${venue.number}"`);
      }
    }
    if (venue?.date != null) {
      if (!eventDate) {
        eventDate = venue.date;
      } else if (eventDate !== venue.date) {
        throw new Error(`Conflicting event date: "${eventDate}" and "${venue.date}"`);
      }
    }
    if (venue?.location != null) {
      if (!eventLocation) {
        eventLocation = venue.location;
      } else if (eventLocation !== venue.location) {
        throw new Error(`Conflicting event location: "${eventLocation}" and "${venue.location}"`);
      }
    }
    if (venue?.publisher != null) {
      if (!venuePublisher) {
        venuePublisher = venue.publisher;
      } else if (venuePublisher !== venue.publisher) {
        throw new Error(
          `Conflicting venue publisher: "${venuePublisher}" and "${venue.publisher}"`,
        );
      }
    }
    if (volume?.number) {
      if (!volumeNumber) {
        volumeNumber = String(volume.number);
      } else if (volumeNumber !== String(volume.number)) {
        throw new Error(`Conflicting volumes: "${volumeNumber}" and "${volume.number}"`);
      }
    }
    if (volume?.doi) {
      if (!volumeDoi) {
        volumeDoi = volume.doi;
      } else if (volumeDoi !== volume.doi) {
        throw new Error(`Conflicting volume dois: "${volumeDoi}" and "${volume.doi}"`);
      }
    }
    if (issue?.number) {
      if (!issueNumber) {
        issueNumber = String(issue.number);
      } else if (issueNumber !== String(issue.number)) {
        throw new Error(`Conflicting issues: "${issueNumber}" and "${issue.number}"`);
      }
    }
    if (issue?.doi) {
      if (!issueDoi) {
        issueDoi = issue.doi;
      } else if (issueDoi !== issue.doi) {
        throw new Error(`Conflicting issue dois: "${issueDoi}" and "${issue.doi}"`);
      }
    }
    if (volume?.title) {
      if (!volumeTitle) {
        volumeTitle = volume.title;
      } else if (volumeTitle !== volume.title) {
        throw new Error(`Conflicting volume titles: "${volumeTitle}" and "${volume.title}"`);
      }
    }
    if (volume?.subject) {
      if (!volumeSubject) {
        volumeSubject = volume.subject;
      } else if (volumeSubject !== volume.subject) {
        throw new Error(
          `Conflicting proceedings subjects: "${volumeSubject}" and "${volume.subject}"`,
        );
      }
    }
    if (editors?.length) {
      publicationEditors = (editors
        ?.map((editor) => contributors?.find(({ id }) => editor === id))
        .filter((editor): editor is Contributor => !!editor)
        .map((editor) => ({
          ...editor,
          affiliations: editor.affiliations?.map((aff) =>
            affiliations?.find((test) => test.id === aff),
          ) as Affiliation[],
        })) ?? []) as (Contributor & { affiliations: Affiliation[] })[];
    }
  });
  return {
    venueTitle,
    venueDoi,
    venueAbbr,
    venueUrl,
    volumeNumber,
    volumeDoi,
    issueNumber,
    issueDoi,
    journalSeries,
    journalIssn,
    eventNumber,
    eventDate,
    eventLocation,
    volumeTitle,
    venuePublisher,
    volumeSubject,
    publicationEditors,
  };
}

async function deposit(session: Session, opts: DepositOptions) {
  let { type: depositType } = opts;
  const { sandbox } = opts;
  const client = new ZenodoClient(process.env.ZENODO_TOKEN, sandbox);
  if (!depositType) {
    const choices: { name: string; value: UploadType }[] = [
      { name: 'Publication', value: 'publication' },
      { name: 'Poster', value: 'poster' },
      { name: 'Presentation', value: 'presentation' },
      { name: 'Dataset', value: 'dataset' },
      { name: 'Image', value: 'image' },
      { name: 'Video', value: 'video' },
      { name: 'Software', value: 'software' },
      { name: 'Lesson', value: 'lesson' },
      { name: 'Physical Object', value: 'physicalobject' },
      { name: 'Other', value: 'other' },
    ];
    const resp = await inquirer.prompt([
      {
        name: 'depositType',
        type: 'list',
        message: 'Deposit type:',
        choices,
      },
    ]);
    depositType = resp.depositType;
  }
  if (!depositType) {
    throw new Error('No deposit type specified');
  }

  const depositSources = await getDepositSources(session, opts);
  const depositArticles = (
    await Promise.all(depositSources.map((source) => depositArticleFromSource(session, source)))
  ).sort((a, b) => Number(a.frontmatter.first_page) - Number(b.frontmatter.first_page));
  if (depositArticles.length === 0) {
    throw Error('nothing found for deposit');
  }
  session.log.info(
    `🔍 Found ${plural('%s article(s)', depositArticles)} for ${depositType} deposit`,
  );
  const { venueTitle, venueAbbr, venueUrl, eventDate, eventLocation, publicationEditors } =
    issueDataFromArticles(session, depositArticles, opts);

  for (let index = 0; index < depositArticles.length; index++) {
    const article = depositArticles[index];
    let zenodoDepositId = getZenodoId(article.configFile);
    if (!article.frontmatter.title) throw new Error('The deposit must have a title');
    if (!article.abstract) throw new Error('The deposit must have an abstract');
    const data: DepositionMetadata = {
      title: article.frontmatter.title,
      description: article.abstract,
      upload_type: depositType,
      publication_date: article.frontmatter.date,
      imprint_publisher: venueAbbr || venueTitle,
      creators:
        article.frontmatter.authors?.map((a) => ({
          // TODO: improve this for non-western name, particles, etc.
          name: `${a.nameParsed?.family}, ${a.nameParsed?.given}` as string,
          affiliation: a.affiliations
            ?.map((aff) => article.frontmatter.affiliations?.find((test) => test.id === aff))
            ?.map((aff) => aff?.name)
            ?.filter((aff) => !!aff)
            .join(', '),
          orcid: a.orcid,
        })) ?? [],
      doi: article.frontmatter.doi,
    };
    if (depositType === 'presentation') {
      data.conference_title = venueTitle;
      data.contributors = publicationEditors?.map(
        (e): ContributorZ => ({
          type: 'Editor',
          name: e.name as string,
          orcid: e.orcid,
          affiliation: e.affiliations.map((a) => a.name).join(', '),
        }),
      );
      data.conference_acronym = venueAbbr;
      data.conference_url = venueUrl;
      data.conference_dates = eventDate;
      data.conference_place = eventLocation;
      if (article.frontmatter.github) {
        data.custom = {
          'code:codeRepository': article.frontmatter.github,
        };
      }
    }
    if (zenodoDepositId) {
      const depositData = await client.updateDeposition(zenodoDepositId, data);
      session.log.debug(JSON.stringify(depositData, null, 2));
      session.log.info(
        `Updating a deposit with ${zenodoDepositId}. See the record at:\n${depositData.links.html}`,
      );
    } else {
      const depositData = await client.createDeposition(data);
      zenodoDepositId = depositData.id as number;
      session.log.debug(JSON.stringify(depositData, null, 2));
      session.log.info(
        `Creating a deposit with ${zenodoDepositId}. See the record at:\n${depositData.links.html}`,
      );
      addZenodoToConfig(article.configFile, zenodoDepositId, sandbox);
    }
    for (let jj = 0; jj < (article.project?.downloads?.length ?? 0); jj++) {
      const download = article.project?.downloads?.[jj];
      if (download?.url) {
        const relativePath = path.join(path.dirname(article.configFile as string), download.url);
        try {
          const file = await client.uploadFile(zenodoDepositId, relativePath);
        } catch (error) {
          session.log.warn('Error writing file, trying again!');
          const file = await client.uploadFile(zenodoDepositId, relativePath);
        }
      }
    }
  }
}

function makeDepositCLI(program: Command) {
  const choices: UploadType[] = [
    'publication',
    'poster',
    'presentation',
    'dataset',
    'image',
    'video',
    'software',
    'lesson',
    'physicalobject',
    'other',
  ];
  const command = new Command('deposit')
    .description('Create Zenodo deposit XML from local MyST content')
    .addOption(new Option('--file <value>', 'File to deposit'))
    .addOption(
      new Option('--type <value>', 'Deposit type').choices(choices).default('presentation'),
    )
    // .addOption(new Option('--id <value>', 'Deposit batch id'))
    // .addOption(new Option('--name <value>', 'Depositor name').default('Curvenote'))
    // .addOption(new Option('--email <value>', 'Depositor email').default('doi@curvenote.com'))
    // .addOption(new Option('--registrant <value>', 'Registrant organization').default('Crossref'))
    // .addOption(new Option('-o, --output <value>', 'Output file'))
    // .addOption(new Option('--prefix <value>', 'Prefix for new DOIs'))
    .addOption(new Option('--sandbox', 'Use the sandbox for testing purposes'))
    .addOption(new Option('--publish', 'Publish the resource'))
    .action(clirun(deposit, { program, getSession: (logger) => new Session({ logger }) }));
  return command;
}

export function addDepositCLI(program: Command) {
  program.addCommand(makeDepositCLI(program));
}

function getZenodoId(configFile: string | undefined): number | undefined {
  // This shouldn't be needed in the future
  if (!configFile) return undefined;
  const data = yamlLoad(fs.readFileSync(configFile).toString()) as {
    project: { zenodo?: string };
  };
  const url = data?.project?.zenodo;
  if (!url) return undefined;
  return Number.parseInt(String(url).split('/').slice(-1)[0], 10);
}
