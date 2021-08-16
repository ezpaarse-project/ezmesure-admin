const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { space } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('ezMESURE user tests', () => {
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

    expect(spaces[0].name).toMatch(space.name);
    expect(spaces[0].color).toMatch(space.color);
    expect(spaces[0].description).toMatch(space.description);
    expect(spaces[0].initials).toMatch(space.initials);
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

    expect(spaces[0].name).toMatch(space.name);
    expect(spaces[0].color).toMatch(space.color);
    expect(spaces[0].description).toMatch(space.description);
    expect(spaces[0].initials).toMatch('TU');
    expect(spaces[0].indexPatterns).toContain(space.indexPattern);
  });
});
