const exec = require('child_process').execFileSync;
const path = require('path');

const institutionData = require('./utils/institution.json');

const login = require('./utils/login');
const { insitution } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Institutions tests', () => {
  beforeEach(() => login());

  it(`Create institution [${insitution.name}]`, () => {
    const res = exec(commandFile, [
      'institutions',
      'add',
      insitution.name,
      '--index', insitution.index,
      '--space', insitution.space,
    ]).toString();

    expect(res).toContain(`institution [${insitution.name}] created`);
    expect(res).toContain(`institution [${insitution.name}] validated`);
    expect(res).toContain(`space [${insitution.space}] created`);
    expect(res).toContain(`index [${insitution.index}] created`);
    expect(res).toContain(`index-pattern [${insitution.index}] created`);
    expect(res).toContain(`role [${insitution.space}] created or updated`);
    expect(res).toContain(`role [${insitution.space}_read_only] created or updated`);
  });

  it(`Get institution [${insitution.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', insitution.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    expect(institutions[0]).toHaveProperty('name', insitution.name);
    expect(institutions[0]).toHaveProperty('indexPrefix', insitution.index);
    expect(institutions[0]).toHaveProperty('space', insitution.space);
    expect(institutions[0]).toHaveProperty('role', insitution.space);
    expect(institutions[0].validated).not.toBeFalsy();
    expect(institutions[0].auto.ezpaarse).toBeFalsy();
    expect(institutions[0].auto.ezmesure).toBeFalsy();
    expect(institutions[0].auto.report).toBeFalsy();
  });

  it('Get institutions', () => {
    const res = exec(commandFile, [
      'institutions',
      'get',
      '--all',
      '--json',
    ]);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    expect(institutions).not.toBeNull();
    expect(institutions.length).toBeGreaterThan(0);
  });

  it('Refresh institutions', () => {
    const res = exec(commandFile, ['institutions', 'refresh']).toString();

    expect(res).toContain('Institutions are refreshed');
  });

  it('Export institutions', () => {
    const res = exec(commandFile, [
      'institutions',
      'export',
      '--all',
    ]);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    expect(institutions.length).not.toBe(0);
  });

  it(`Import institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'institutions',
      'import',
      '--files',
      path.resolve(process.cwd(), 'tests', 'utils', 'institution.json'),
    ]).toString();

    expect(res).toContain(`institution [${institutionData.institution.name}] imported`);
    expect(res).toContain(`space [${institutionData.space.name}] imported`);
    expect(res).toContain(`index [${institutionData.institution.indexPrefix}] imported`);
    expect(res).toContain(`index-pattern [${institutionData.indexPattern[0].title}] imported`);
  });
});
