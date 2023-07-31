const exec = require('child_process').execFileSync;
const path = require('path');

const institutionsLib = require('../../lib/institutions');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const login = require('../utils/login');

describe('[institutions]: Test get features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  beforeAll(async () => {
    await login();
  });

  describe('eza institution get', () => {
    let institutionId;

    beforeAll(async () => {
      await institutionsLib.create(institutionTest);
    });

    it('Should get institutions', () => {
      const res = exec(commandFile, ['institutions', 'get', '--json']).toString();

      let institutions = res;

      institutions = JSON.parse(institutions);

      const institution = institutions[0];

      institutionId = institution?.id;
      expect(institutionId).not.toBeNull();
      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', 'Test');
      expect(institution).toHaveProperty('namespace', 'test');
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

  describe('eza institution get <Institution name>', () => {
    let institutionId;

    beforeAll(async () => {
      await institutionsLib.create(institutionTest);
    });

    it('Should get institution', () => {
      const res = exec(commandFile, ['institutions', 'get', institutionTest.name, '--json']).toString();

      let institutions = res;

      institutions = JSON.parse(institutions);

      const institution = institutions[0];

      institutionId = institution?.id;
      expect(institutionId).not.toBeNull();
      expect(institution).toHaveProperty('parentInstitutionId', null);
      expect(institution?.createdAt).not.toBeNull();
      expect(institution?.updatedAt).not.toBeNull();
      expect(institution).toHaveProperty('name', 'Test');
      expect(institution).toHaveProperty('namespace', 'test');
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
