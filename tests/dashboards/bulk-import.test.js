const exec = require('child_process').execFileSync;
const path = require('path');

const spacesLib = require('../../lib/spaces');
const institutionsLib = require('../../lib/institutions');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const dashboardFile = path.resolve(__dirname, '..', 'sources', 'dashboards', 'generic_ezunpaywall.json');

const login = require('../utils/login');

describe('[dashboard]: Test import features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  let institutionId;

  const spaceConfigTest = {
    id: 'test-ezpaarse-id',
    institutionId: '',
    type: 'ezpaarse',
    name: 'test-ezpaarse-name',
    description: 'ezpaarse space for test institution',
    initials: 'EZ',
  };

  beforeAll(async () => {
    await login();
  });

  describe('eza dashboard import', () => {
    beforeAll(async () => {
      const { data } = await institutionsLib.create(institutionTest);
      institutionId = data?.id;
      spaceConfigTest.institutionId = institutionId;
      await spacesLib.create(spaceConfigTest);
    });

    it('Should import dashboard', async () => {
      let res;

      try {
        res = exec(commandFile, ['dashboard', 'import', spaceConfigTest.id, '-f', dashboardFile]).toString();
      } catch (err) {
        console.log(err?.stdout?.toString());
      }

      const testMessage = res.includes('Dashboard imported [ezunpw : generic et suivi par heure] successfully');
      expect(testMessage).toBe(true);
    });

    afterAll(async () => {
      await spacesLib.delete(spaceConfigTest.id);
      await institutionsLib.delete(institutionId);
    });
  });
});
