const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { spaceTest } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('ezMESURE user tests', () => {
  beforeEach(() => login());

  it(`Create space [${spaceTest.name}]`, () => {
    const res = exec(commandFile, [
      'spaces',
      'add',
      spaceTest.name,
      '--color', spaceTest.color,
      '--description', spaceTest.description,
      '--initials', spaceTest.initials,
      '--features', spaceTest.features,
    ]).toString();

    expect(res).toContain(`space [${spaceTest.name}] created successfully`);
  });

  it(`Create index [${spaceTest.index}]`, () => {
    const res = exec(commandFile, ['indices', 'add', spaceTest.index]).toString();

    expect(res).toContain(`index [${spaceTest.index}] created successfully`);
  });

  it(`Create index-pattern [${spaceTest.indexPattern}]`, () => {
    const res = exec(commandFile, ['index-pattern', 'add', spaceTest.name, spaceTest.indexPattern]).toString();

    expect(res).toContain(`index-pattern [${spaceTest.indexPattern}] created in space [${spaceTest.name}]`);
  });

  it(`Get space [${spaceTest.name}]`, () => {
    const res = exec(commandFile, ['spaces', 'get', spaceTest.name, '--json']);

    let spaces = res.toString();

    try {
      spaces = JSON.parse(spaces);
    } catch (error) {
      console.error(error);
    }

    expect(spaces[0].name).toMatch(spaceTest.name);
    expect(spaces[0].color).toMatch(spaceTest.color);
    expect(spaces[0].description).toMatch(spaceTest.description);
    expect(spaces[0].initials).toMatch(spaceTest.initials);
    expect(spaces[0].indexPatterns).toContain(spaceTest.indexPattern);
  });

  it(`Update space [${spaceTest.name}] change initials [${spaceTest.initials} -> TU]`, () => {
    const res = exec(commandFile, ['spaces', 'update', spaceTest.name, '--initials', 'TU']).toString();

    expect(res).toContain(`space [${spaceTest.name}] updated successfully`);
  });

  it(`Get space [${spaceTest.name}] after initials was changed`, () => {
    const res = exec(commandFile, ['spaces', 'get', spaceTest.name, '--json']);

    let spaces = res.toString();

    try {
      spaces = JSON.parse(spaces);
    } catch (error) {
      console.error(error);
    }

    expect(spaces[0].name).toMatch(spaceTest.name);
    expect(spaces[0].color).toMatch(spaceTest.color);
    expect(spaces[0].description).toMatch(spaceTest.description);
    expect(spaces[0].initials).toMatch('TU');
    expect(spaces[0].indexPatterns).toContain(spaceTest.indexPattern);
  });
});
