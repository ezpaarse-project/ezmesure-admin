const exec = require('child_process').execFileSync;
const path = require('path');

const institutionsLib = require('../../lib/institutions');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const login = require('../utils/login');

describe('[institutions]: Test add features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  beforeAll(async () => {
    await login();
  });

  describe('eza institution add', () => {
    let institutionId;

    it('Should add institutions', () => {
      const res = exec(commandFile, ['institutions', 'add', institutionTest.name]).toString();

      const testMessage = res.includes(`Institution [${institutionTest.name}] is created`);
      expect(testMessage).toBe(true);
    });

    it('Should get institution', async () => {
      const { data } = await institutionsLib.getAll();

      const [institution] = data;

      institutionId = institution?.id;
      expect(institutionId).not.toBeNull();
      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', 'Test');
      expect(institution).toHaveProperty('namespace', null);
      expect(institution).toHaveProperty('validated', false);
      expect(institution).toHaveProperty('hidePartner', false);
      expect(institution).toHaveProperty('tags', []);
      expect(institution).toHaveProperty('logoId', null);
      expect(institution).toHaveProperty('type', null);
      expect(institution).toHaveProperty('acronym', null);
      expect(institution).toHaveProperty('websiteUrl', null);
      expect(institution).toHaveProperty('city', null);
      expect(institution).toHaveProperty('uai', null);
      expect(institution).toHaveProperty('social', null);
      expect(institution).toHaveProperty('sushiReadySince', null);
    });

    afterAll(async () => {
      await institutionsLib.delete(institutionId);
    });
  });
});
