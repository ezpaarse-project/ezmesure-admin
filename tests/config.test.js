const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Configuation tests', () => {
  beforeEach(() => login());

  it('Set locally key:value', () => {
    const res = exec(commandFile, ['config', 'set', 'unitTest', true]).toString();

    expect(res).toBe('');
  });

  it('Get local configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--local']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('unitTest', true);
  });

  it('Set globally key:value', () => {
    const res = exec(commandFile, ['config', 'set', '--global', 'unitTest.globaly', 'global']).toString();

    expect(res).toBe('');
  });

  it('Get global configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--global']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('unitTest.globaly', 'global');
  });

  it('Delete local and global key from configuration', () => {
    const local = exec(commandFile, ['config', 'delete', 'unitTest']).toString();
    expect(local).toContain('Config key [unitTest] has been removed successfully');

    const global = exec(commandFile, ['config', 'delete', '--global', 'unitTest']).toString();
    expect(global).toContain('Config key [unitTest] has been removed successfully');
  });

  it('Get merged configuration', () => {
    let res = exec(commandFile, ['config', 'view']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).not.toHaveProperty('unitTest');
  });
});
