const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('cluster tests', () => {
  beforeAll(() => login());

  it('#1 Get ElasticSearch cluster settings', () => {
    const res = exec(commandFile, ['cluster', 'settings']).toString();

    let settings = res.toString();

    try {
      settings = JSON.parse(settings);
    } catch (error) {
      console.error(error);
    }

    expect(settings).not.toBeNull();
    expect(typeof settings).toBe('object');
    expect(settings).toMatchObject({
      persistent: {
        xpack: {
          monitoring: {
            collection: {
              enabled: 'true',
            },
          },
        },
      },
      transient: {},
    });
  });
});
