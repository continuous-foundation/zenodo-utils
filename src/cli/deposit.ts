import { Command, Option } from 'commander';
import { clirun, Session } from 'myst-cli-utils';
import { UploadType, ZenodoClient } from '../index.js';

type DepositOptions = {
  sandbox?: boolean;
};

async function depositData(session: Session, { sandbox }: DepositOptions) {
  const client = new ZenodoClient(process.env.ZENODO_TOKEN, sandbox);
  const deposit = await client.createDeposition({
    title: 'Testing',
    description: 'testing!',
    upload_type: UploadType.presentation,
    publication_date: '2024-10-08',
    creators: [{ name: 'Rowan Cockett' }],
  });
  const id = deposit.id;
  session.log.info(`Creating a deposit with ${id}. See the record at:\n${deposit.links.html}`);
  const file = await client.uploadFile(id, 'temp.png');
  console.log(file);
}

function makeDepositCLI(program: Command) {
  const command = new Command('deposit')
    .description('Create Zenodo deposit XML from local MyST content')
    .addOption(new Option('--sandbox', 'Use the sandbox for testing purposes'))
    // .addOption(
    //   new Option('--type <value>', 'Deposit type')
    //     .choices(['conference', 'journal', 'preprint'])
    //     .default('preprint'),
    // )
    // .addOption(new Option('--id <value>', 'Deposit batch id'))
    // .addOption(new Option('--name <value>', 'Depositor name').default('Curvenote'))
    // .addOption(new Option('--email <value>', 'Depositor email').default('doi@curvenote.com'))
    // .addOption(new Option('--registrant <value>', 'Registrant organization').default('Crossref'))
    // .addOption(new Option('-o, --output <value>', 'Output file'))
    // .addOption(new Option('--prefix <value>', 'Prefix for new DOIs'))
    .action(clirun(depositData, { program, getSession: (logger) => new Session({ logger }) }));
  return command;
}

export function addDepositCLI(program: Command) {
  program.addCommand(makeDepositCLI(program));
}
