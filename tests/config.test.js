const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Configuation tests', () => {
  beforeEach(() => login());

  it('Set locally key:value', () => {
    const res = exec(commandFile, ['config', 'set', 'locally', 'local']).toString();

    expect(res).toBe('');
  });

  it('Get local configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--local']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('locally', 'local');
  });

  it('Set globally key:value', () => {
    const res = exec(commandFile, ['config', 'set', '--global', 'globaly', 'global']).toString();

    expect(res).toBe('');
  });

  it('Get global configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--global']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('globaly', 'global');
  });

  it('Delete local and global key from configuration', () => {
    const local = exec(commandFile, ['config', 'delete', 'locally']).toString();
    expect(local).toContain('Config key [locally] has been removed successfully');

    const global = exec(commandFile, ['config', 'delete', '--global', 'globaly']).toString();
    expect(global).toContain('Config key [globaly] has been removed successfully');
  });

  it('Get merged configuration', () => {
    let res = exec(commandFile, ['config', 'view']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('elastic');
    expect(res).toHaveProperty('ezmesure');
  });
});
