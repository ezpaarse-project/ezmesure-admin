const exec = require('child_process').execFileSync;
const path = require('path');

const institutionData = require('./utils/institution.json');

const login = require('./utils/login');
const { institution } = require('./utils/data');
const institutionsLib = require('../lib/institutions');
const rolesLib = require('../lib/roles');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const institutionsIds = [];

describe('Institutions tests', () => {
  beforeEach(() => login());

  it(`Create institution [${institution.name}]`, () => {
    const res = exec(commandFile, [
      'institutions',
      'add',
      institution.name,
      '--index', institution.index,
      '--space', institution.space,
    ]).toString();

    expect(res).toContain(`institution [${institution.name}] created`);
    expect(res).toContain(`institution [${institution.name}] validated`);
    expect(res).toContain(`space [${institution.space}] created`);
    expect(res).toContain(`index [${institution.index}] created`);
    expect(res).toContain(`index-pattern [${institution.index}] created`);
    expect(res).toContain(`role [${institution.space}] created or updated`);
    expect(res).toContain(`role [${institution.space}_read_only] created or updated`);
  });

  it(`Get institution [${institution.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', institution.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    institutionsIds.push(institutions[0].id);

    expect(institutions[0]).toHaveProperty('name', institution.name);
    expect(institutions[0]).toHaveProperty('indexPrefix', institution.index);
    expect(institutions[0]).toHaveProperty('space', institution.space);
    expect(institutions[0]).toHaveProperty('role', institution.space);
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

  it(`Get institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', institutionData.institution.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    institutionsIds.push(institutions[0].id);

    expect(institutions[0]).toHaveProperty('name', institutionData.institution.name);
    expect(institutions[0]).toHaveProperty('indexPrefix', institutionData.institution.indexPrefix);
    expect(institutions[0]).toHaveProperty('space', institutionData.space.name);
    expect(institutions[0]).toHaveProperty('role', institutionData.space.name);
    expect(institutions[0].validated).not.toBeFalsy();
    expect(institutions[0].auto.ezpaarse).toBeFalsy();
    expect(institutions[0].auto.ezmesure).toBeFalsy();
    expect(institutions[0].auto.report).toBeFalsy();
  });

  it('Remove institutions and roles associated', async () => {
    expect.assertions(2);

    try {
      await institutionsLib.delete(institutionsIds[0]);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
    try {
      await rolesLib.delete(institution.space);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
    try {
      await rolesLib.delete(`${institution.space}_read_only`);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }

    try {
      await institutionsLib.delete(institutionsIds[1]);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
    try {
      await rolesLib.delete(institutionData.space.name);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
    try {
      await rolesLib.delete(`${institutionData.space.name}_read_only`);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
  });
});
