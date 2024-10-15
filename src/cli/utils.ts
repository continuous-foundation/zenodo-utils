import fs from 'node:fs';

export function addZenodoToConfig(
  configFile: string | undefined,
  zenodoId: string | number,
  sandbox?: boolean,
) {
  if (!configFile) return;
  const file = fs.readFileSync(configFile).toString();
  const lines = file.split('\n');
  const projectIndex = lines.findIndex((line) => line.trim() === 'project:');
  const newLines = [
    ...lines.slice(0, projectIndex + 1),
    `  zenodo: https://${sandbox ? 'sandbox.' : ''}zenodo.org/deposit/${zenodoId}`,
    ...lines.slice(projectIndex + 1),
  ];
  fs.writeFileSync(configFile, newLines.join('\n'));
}
