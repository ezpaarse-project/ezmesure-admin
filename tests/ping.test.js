const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('ping tests', () => {
  beforeAll(() => login());

  it('#1 Ping', () => {
    const res = exec(commandFile, ['ping']).toString();

    const ping = res.split('\n')
      .map((x) => x.replace(/\n|\r/g, ''))
      .filter((x) => x);

    expect(ping).toStrictEqual(['ElasticSearch: OK', 'ezMESURE: OK']);
  });
});
