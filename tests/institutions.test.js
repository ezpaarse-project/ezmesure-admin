const exec = require('child_process').execFileSync;
const path = require('path');
const fs = require('fs-extra');

const institutionData = require('./utils/data/institution.json');

const login = require('./utils/login');
const institutionsLib = require('../lib/institutions');
const rolesLib = require('../lib/roles');
const spacesLib = require('../lib/spaces');
const indicesLib = require('../lib/indices');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const institutionsIds = [];

const institution = {
  name: 'ezmesure-admin institution',
  index: 'eza-ut-institution',
  space: 'eza-ut-institution',
};

describe('institutions tests', () => {
  beforeAll(() => login());

  it(`#1 Create institution [${institution.name}]`, () => {
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

  it(`#2 Get institution [${institution.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', institution.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    institutionsIds.push(institutions[0].id);

    expect(Array.isArray(institutions)).toBeTruthy();
    expect(institutions).toHaveLength(1);
    expect(institutions[0]).toHaveProperty('id');
    expect(institutions[0]).toHaveProperty('name', institution.name);
    expect(institutions[0]).toHaveProperty('indexPrefix', institution.index);
    expect(institutions[0]).toHaveProperty('space', institution.space);
    expect(institutions[0]).toHaveProperty('role', institution.space);
    expect(institutions[0].validated).not.toBeFalsy();
    expect(institutions[0].auto.ezpaarse).toBeFalsy();
    expect(institutions[0].auto.ezmesure).toBeFalsy();
    expect(institutions[0].auto.report).toBeFalsy();
  });

  it('#3 Get institutions', () => {
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

    expect(Array.isArray(institutions)).toBeTruthy();
    expect(institutions.length).toBeGreaterThan(0);
  });

  it('#4 Refresh institutions', () => {
    const res = exec(commandFile, ['institutions', 'refresh']).toString();

    expect(res).toContain('Institutions are refreshed');
  });

  it('#5 Export institutions', () => {
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

    expect(Array.isArray(institutions)).toBeTruthy();
    expect(institutions.length).toBeGreaterThan(0);
  });

  it(`#6 Import institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'institutions',
      'import',
      '--files',
      path.resolve(process.cwd(), 'tests', 'utils', 'data', 'institution.json'),
    ]).toString();

    expect(res).toContain(`institution [${institutionData.institution.name}] imported`);
    expect(res).toContain(`space [${institutionData.space.name}] imported`);
    expect(res).toContain(`index [${institutionData.institution.indexPrefix}] imported`);
    expect(res).toContain(`index-pattern [${institutionData.indexPattern[0].title}] imported`);
    expect(res).toBeDefined();
  });

  it(`#7 Get institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', institutionData.institution.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    institutionsIds.push(institutions[0].id);

    expect(Array.isArray(institutions)).toBeTruthy();
    expect(institutions).toHaveLength(1);
    expect(institutions[0]).toHaveProperty('name', institutionData.institution.name);
    expect(institutions[0]).toHaveProperty('indexPrefix', institutionData.institution.indexPrefix);
    expect(institutions[0]).toHaveProperty('space', institutionData.space.name);
    expect(institutions[0]).toHaveProperty('role', institutionData.space.name);
    expect(institutions[0].validated).not.toBeFalsy();
    expect(institutions[0].auto.ezpaarse).toBeFalsy();
    expect(institutions[0].auto.ezmesure).toBeFalsy();
    expect(institutions[0].auto.report).toBeFalsy();
  });

  it(`#8 Import SUSHI credentials for institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'sushi',
      'import',
      institutionData.institution.name,
      '--files', path.resolve(process.cwd(), 'tests', 'utils', 'data', 'sushi.json'),
    ]).toString();

    expect(res).toContain(`SUSHI credentials [Springer Nature] for institution [${institutionData.institution.name}] imported`);
  });

  it(`#9 Export SUSHI credentials for institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'sushi',
      'export',
      path.resolve(process.cwd(), 'tests', 'utils'),
      institutionData.institution.name,
      '--json',
    ]).toString();

    const filePath = res.substring(res.indexOf('(') + 1, res.indexOf(')'));
    const fileExists = fs.existsSync(path.resolve(filePath));

    expect(fileExists).toBeTruthy();
    expect(res).toContain('exported successfully');

    fs.unlinkSync(filePath);

    expect(res).toContain(`Sushi exported successfully for institution [${institutionData.institution.name}]`);
  });

  it(`#10 List SUSHI credentials for institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'sushi',
      'list',
      institutionData.institution.name,
      '--json',
    ]);

    let credentials = res.toString();

    try {
      credentials = JSON.parse(credentials);
    } catch (error) {
      console.error(error);
    }

    expect(Array.isArray(credentials)).toBeTruthy();
    expect(credentials).toHaveLength(1);
  });

  it(`#11 Info SUSHI credentials for institution [${institutionData.institution.name}]`, () => {
    const res = exec(commandFile, [
      'sushi',
      'info',
      institutionData.institution.name,
      '--json',
    ]);

    let credentials = res.toString();

    try {
      credentials = JSON.parse(credentials);
    } catch (error) {
      console.error(error);
    }

    expect(Array.isArray(credentials)).toBeTruthy();
    expect(credentials).not.toHaveLength(0);
    expect(credentials[0]).toHaveProperty('name', institutionData.institution.name);
    expect(credentials[0]).toHaveProperty('success');
    expect(credentials[0].success).toHaveLength(1);
    expect(credentials[0].success[0]).toHaveProperty('status', 'success');
    expect(credentials[0].success[0].reports).toStrictEqual(expect.arrayContaining([
      'TR_J2',
      'DR_D1',
      'TR_B2',
      'TR_J3',
      'TR_B3',
      'TR_J4',
      'PR_P1',
      'TR_J1',
      'TR_B1',
      'DR_D2',
      'TR',
      'PR',
    ]));
  });

  it('#12 Delete all', async () => {
    // Delete first institution after tests
    let res = await spacesLib.delete(institution.space);
    expect(res).toHaveProperty('status', 204);

    res = await institutionsLib.delete(institutionsIds[0]);
    expect(res).toHaveProperty('status', 204);

    res = await rolesLib.delete(institution.space);
    expect(res).toHaveProperty('status', 204);

    res = await rolesLib.delete(`${institution.space}_read_only`);
    expect(res).toHaveProperty('status', 204);

    res = await indicesLib.delete(institution.index);

    // Delete first institution after tests
    expect(res).toHaveProperty('status', 204);

    res = await spacesLib.delete(institutionData.space.name);
    expect(res).toHaveProperty('status', 204);

    res = await institutionsLib.delete(institutionsIds[1]);
    expect(res).toHaveProperty('status', 204);

    res = await rolesLib.delete(institutionData.space.name);
    expect(res).toHaveProperty('status', 204);

    res = await rolesLib.delete(`${institutionData.space.name}_read_only`);
    expect(res).toHaveProperty('status', 204);

    res = await indicesLib.delete(institutionData.institution.indexPrefix);
    expect(res).toHaveProperty('status', 204);
  });
});
