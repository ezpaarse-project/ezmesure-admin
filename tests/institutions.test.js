const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { insitutionTest } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Institutions tests', () => {
  beforeEach(() => login());

  test(`Create institution [${insitutionTest.name}]`, () => {
    const res = exec(commandFile, [
      'institutions',
      'add',
      insitutionTest.name,
      '--index', insitutionTest.index,
      '--space', insitutionTest.space,
    ]).toString();

    expect(res).toContain(`institution [${insitutionTest.name}] created`);
    expect(res).toContain(`institution [${insitutionTest.name}] validated`);
    expect(res).toContain(`space [${insitutionTest.space}] created`);
    expect(res).toContain(`index [${insitutionTest.index}] created`);
    expect(res).toContain(`index-pattern [${insitutionTest.index}] created`);
    expect(res).toContain(`role [${insitutionTest.space}] created or updated`);
    expect(res).toContain(`role [${insitutionTest.space}_read_only] created or updated`);
  });

  test(`Get institution [${insitutionTest.name}]`, () => {
    const res = exec(commandFile, ['institutions', 'get', insitutionTest.name, '--json']);

    let institutions = res.toString();

    try {
      institutions = JSON.parse(institutions);
    } catch (error) {
      console.error(error);
    }

    expect(institutions[0].name).toStrictEqual(insitutionTest.name);
    expect(institutions[0].indexPrefix).toStrictEqual(insitutionTest.index);
    expect(institutions[0].space).toStrictEqual(insitutionTest.space);
    expect(institutions[0].role).toStrictEqual(insitutionTest.space);
    expect(institutions[0].validated).not.toBeFalsy();
    expect(institutions[0].auto.ezpaarse).toBeFalsy();
    expect(institutions[0].auto.ezmesure).toBeFalsy();
    expect(institutions[0].auto.report).toBeFalsy();
  });

  test('Get institutions', () => {
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

  test('Refresh institutions', () => {
    const res = exec(commandFile, ['institutions', 'refresh']).toString();

    expect(res).toContain('Institutions are refreshed');
  });
});
