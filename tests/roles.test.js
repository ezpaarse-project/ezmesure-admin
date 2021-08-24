const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const spacesLib = require('../lib/spaces');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const space = {
  name: 'eza-ut-role',
  index: 'eza-ut-role',
  indexPattern: 'eza-ut-role*',
};

const role = {
  name: 'eza-role-ut',
  indexPattern: space.indexPattern,
  space: space.name,
  privileges: 'read',
};

describe('roles tests', () => {
  beforeAll(() => login());

  beforeAll(async () => {
    // Create space before tests
    // Create space before tests
    await spacesLib.create({
      id: space.name,
      name: space.name,
    });
  });

  it(`#1 Add new role [${role.name}]`, () => {
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

  it(`#2 Get role [${role.name}]`, () => {
    const res = exec(commandFile, ['roles', 'get', role.name, '--json']).toString();

    let roles = [];
    try {
      roles = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(roles).toHaveLength(1);
    expect(roles[0]).toHaveProperty('name', role.name);
    expect(roles[0].kibana[0]).toHaveProperty('base', [role.privileges]);
    expect(roles[0].kibana[0]).toHaveProperty('spaces', [role.space]);
  });

  it(`#3 Update role [${role.name}]`, () => {
    const res = exec(commandFile, [
      'roles',
      'update',
      role.name,
      '--space-add', `${role.space}:all`,
    ]).toString();

    expect(res).toContain(`role [${role.name}] updated successfully`);
  });

  it(`#4 Get role [${role.name}] after update`, () => {
    const res = exec(commandFile, ['roles', 'get', role.name, '--json']).toString();

    let roles = [];
    try {
      roles = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(roles).toHaveLength(1);
    expect(roles[0]).toHaveProperty('name', role.name);
    expect(roles[0].kibana[0]).toHaveProperty('base', ['all']);
    expect(roles[0].kibana[0]).toHaveProperty('spaces', [role.space]);
  });

  it(`#5 Delete role [${role.name}]`, () => {
    const res = exec(commandFile, ['roles', 'delete', role.name]).toString();

    expect(res).toContain(`role [${role.name}] deleted succefully`);
  });

  it('#6 Delete data', async () => {
    const res = await spacesLib.delete(space.name);
    expect(res).toHaveProperty('status', 204);
  });
});
