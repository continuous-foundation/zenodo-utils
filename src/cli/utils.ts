import fs from 'node:fs';

/**
 * Add Zenodo ID to project identifiers in config file
 *
 * This function assumes there is no zenodo identifier present
 */
export function addZenodoToConfig(
  configFile: string | undefined,
  zenodoId: string | number,
  sandbox?: boolean,
) {
  if (!configFile) return;
  const file = fs.readFileSync(configFile).toString();
  const lines = file.split('\n');
  const identifiersIndex = lines.findIndex((line) => line.trim() === 'identifiers:');
  let newLines: string[];
  if (identifiersIndex !== -1) {
    newLines = [
      ...lines.slice(0, identifiersIndex + 1),
      `    zenodo: https://${sandbox ? 'sandbox.' : ''}zenodo.org/deposit/${zenodoId}`,
      ...lines.slice(identifiersIndex + 1),
    ];
  } else {
    const projectIndex = lines.findIndex((line) => line.trim() === 'project:');
    newLines = [
      ...lines.slice(0, projectIndex + 1),
      `  identifiers:`,
      `    zenodo: https://${sandbox ? 'sandbox.' : ''}zenodo.org/deposit/${zenodoId}`,
      ...lines.slice(projectIndex + 1),
    ];
  }
  fs.writeFileSync(configFile, newLines.join('\n'));
}

/**
 * Add Zenodo ID to project identifiers in config file
 *
 * This function assumes there is no zenodo identifier present
 */
export function addDoiToConfig(configFile: string | undefined, doi: string) {
  if (!configFile) return;
  const file = fs.readFileSync(configFile).toString();
  const lines = file.split('\n');
  const projectIndex = lines.findIndex((line) => line.trim() === 'project:');
  const newLines = [
    ...lines.slice(0, projectIndex + 1),
    `  doi: ${doi}`,
    ...lines.slice(projectIndex + 1),
  ];
  fs.writeFileSync(configFile, newLines.join('\n'));
}
