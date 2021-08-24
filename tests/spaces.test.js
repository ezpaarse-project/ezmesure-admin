const exec = require('child_process').execFileSync;
const path = require('path');
const fs = require('fs-extra');

const login = require('./utils/login');
const spacesLib = require('../lib/spaces');
const indicesLib = require('../lib/indices');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const space = {
  name: 'eza-ut-space',
  color: '#c0392b',
  description: 'ezmesure-admin Unit Tests',
  initials: 'UT',
  features: 'discover,dashboard',
  index: 'eza-ut-space',
  indexPattern: 'eza-ut-space*',
};

describe('ezMESURE spaces tests', () => {
  beforeAll(() => login());

  it(`#1 Create space [${space.name}]`, () => {
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

  it(`#2 Create index [${space.index}]`, () => {
    const res = exec(commandFile, ['indices', 'add', space.index]).toString();

    expect(res).toContain(`index [${space.index}] created successfully`);
  });

  it(`#3 Create index-pattern [${space.indexPattern}]`, () => {
    const res = exec(commandFile, ['index-pattern', 'add', space.name, space.indexPattern]).toString();

    expect(res).toContain(`index-pattern [${space.indexPattern}] created in space [${space.name}]`);
  });

  it(`#4 Get space [${space.name}]`, () => {
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

  it(`#5 Update space [${space.name}] change initials [${space.initials} -> TU]`, () => {
    const res = exec(commandFile, ['spaces', 'update', space.name, '--initials', 'TU']).toString();

    expect(res).toContain(`space [${space.name}] updated successfully`);
  });

  it(`#6 Get space [${space.name}] after initials was changed`, () => {
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

  it(`#7 Import dashboard into space [${space.name}]`, () => {
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

  it(`#8 Export dashboard from space [${space.name}]`, () => {
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

  it('#9 Delete data', async () => {
    // Delete space after tests
    let res = await spacesLib.delete(space.name);
    expect(res).toHaveProperty('status', 204);

    // Delete indices
    res = await indicesLib.delete(space.index);
    expect(res).toHaveProperty('status', 204);
  });
});
