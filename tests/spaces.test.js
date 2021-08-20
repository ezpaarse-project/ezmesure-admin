const exec = require('child_process').execFileSync;
const path = require('path');
const fs = require('fs-extra');

const login = require('./utils/login');
const { space } = require('./utils/data');
const spacesLib = require('../lib/spaces');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('ezMESURE spaces tests', () => {
  beforeEach(() => login());

  it(`Create space [${space.name}]`, () => {
    const res = exec(commandFile, [
      'spaces',
      'add',
      space.name,
      '--color', space.color,
      '--description', space.description,
      '--initials', space.initials,
      '--features', space.features,
    ]).toString();

    expect(res).toContain(`space [${space.name}] created successfully`);
  });

  it(`Create index [${space.index}]`, () => {
    const res = exec(commandFile, ['indices', 'add', space.index]).toString();

    expect(res).toContain(`index [${space.index}] created successfully`);
  });

  it(`Create index-pattern [${space.indexPattern}]`, () => {
    const res = exec(commandFile, ['index-pattern', 'add', space.name, space.indexPattern]).toString();

    expect(res).toContain(`index-pattern [${space.indexPattern}] created in space [${space.name}]`);
  });

  it(`Get space [${space.name}]`, () => {
    const res = exec(commandFile, ['spaces', 'get', space.name, '--json']);

    let spaces = res.toString();

    try {
      spaces = JSON.parse(spaces);
    } catch (error) {
      console.error(error);
    }

    expect(spaces[0]).toHaveProperty('name', space.name);
    expect(spaces[0]).toHaveProperty('color', space.color);
    expect(spaces[0]).toHaveProperty('description', space.description);
    expect(spaces[0]).toHaveProperty('initials', space.initials);
    expect(spaces[0].indexPatterns).toContain(space.indexPattern);
  });

  it(`Update space [${space.name}] change initials [${space.initials} -> TU]`, () => {
    const res = exec(commandFile, ['spaces', 'update', space.name, '--initials', 'TU']).toString();

    expect(res).toContain(`space [${space.name}] updated successfully`);
  });

  it(`Get space [${space.name}] after initials was changed`, () => {
    const res = exec(commandFile, ['spaces', 'get', space.name, '--json']);

    let spaces = res.toString();

    try {
      spaces = JSON.parse(spaces);
    } catch (error) {
      console.error(error);
    }

    expect(spaces[0]).toHaveProperty('name', space.name);
    expect(spaces[0]).toHaveProperty('color', space.color);
    expect(spaces[0]).toHaveProperty('description', space.description);
    expect(spaces[0]).toHaveProperty('initials', 'TU');
    expect(spaces[0]).toHaveProperty('indexPatterns');
    expect(spaces[0].indexPatterns).toContain(space.indexPattern);
  });

  it(`Import dashboard into space [${space.name}]`, () => {
    const res = exec(commandFile, [
      'dashboard',
      'import',
      space.name,
      '--index-pattern',
      space.indexPattern,
      '--files',
      path.resolve(process.cwd(), 'tests', 'utils', 'data', 'dashboard.json'),
    ]).toString();

    expect(res).toContain('Dashboard imported');
  });

  it(`Export dashboard from space [${space.name}]`, () => {
    const res = exec(commandFile, [
      'dashboard',
      'export',
      space.name,
      '--dashboard',
      'homepage',
      '--output',
      path.resolve(process.cwd(), 'tests', 'utils'),
    ]).toString();

    const filePath = res.substring(res.indexOf('(') + 1, res.indexOf(')'));
    const fileExists = fs.existsSync(path.resolve(filePath));

    expect(fileExists).toBeTruthy();
    expect(res).toContain('exported successfully');

    fs.unlinkSync(filePath);
  });

  it(`Delete space [${space.name}]`, async () => {
    const { status } = await spacesLib.delete(space.name);
    expect(status).toBe(204);
  });
});
