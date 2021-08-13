const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { spaceTest } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('ezMESURE user tests', () => {
  beforeEach(() => login());

  test(`Create space [${spaceTest.name}]`, () => {
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

  test(`Create index [${spaceTest.index}]`, () => {
    const res = exec(commandFile, ['indices', 'add', spaceTest.index]).toString();

    expect(res).toContain(`index [${spaceTest.index}] created successfully`);
  });

  test(`Create index-pattern [${spaceTest.indexPattern}]`, () => {
    const res = exec(commandFile, ['index-pattern', 'add', spaceTest.name, spaceTest.indexPattern]).toString();

    expect(res).toContain(`index-pattern [${spaceTest.indexPattern}] created in space [${spaceTest.name}]`);
  });
});
