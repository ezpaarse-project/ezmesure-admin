const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { role } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Roles tests', () => {
  beforeEach(() => login());

  it(`Add new role [${role.name}]`, () => {
    const res = exec(commandFile, [
      'roles',
      'add',
      role.name,
      '--index-pattern', role.indexPattern,
      '--space', role.space,
      '--privileges', role.privileges,
    ]).toString();

    expect(res).toContain(`role [${role.name}] created or updated`);
  });

  it(`Get role [${role.name}]`, () => {
    const res = exec(commandFile, ['roles', 'get', role.name, '--json']).toString();

    let roles = [];
    try {
      roles = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(roles.length).toBe(1);
    expect(roles[0]).toHaveProperty('name', role.name);
    expect(roles[0].kibana[0]).toHaveProperty('base', [role.privileges]);
    expect(roles[0].kibana[0]).toHaveProperty('spaces', [role.space]);
  });

  it(`Update role [${role.name}]`, () => {
    const res = exec(commandFile, [
      'roles',
      'update',
      role.name,
      '--space-add', `${role.space}:all`,
    ]).toString();

    expect(res).toContain(`role [${role.name}] updated successfully`);
  });

  it(`Get role [${role.name}] after update`, () => {
    const res = exec(commandFile, ['roles', 'get', role.name, '--json']).toString();

    let roles = [];
    try {
      roles = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(roles.length).toBe(1);
    expect(roles[0]).toHaveProperty('name', role.name);
    expect(roles[0].kibana[0]).toHaveProperty('base', ['all']);
    expect(roles[0].kibana[0]).toHaveProperty('spaces', [role.space]);
  });

  it(`Delete role [${role.name}]`, () => {
    const res = exec(commandFile, ['roles', 'delete', role.name]).toString();

    expect(res).toContain(`role [${role.name}] deleted succefully`);
  });
});
