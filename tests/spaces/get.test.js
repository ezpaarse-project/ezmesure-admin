const exec = require('child_process').execFileSync;
const path = require('path');

const spacesLib = require('../../lib/spaces');
const institutionsLib = require('../../lib/institutions');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const login = require('../utils/login');

describe('[spaces]: Test get features', () => {
  const institutionTest = {
    name: 'Test',
    namespace: 'test',
  };

  let institutionId;

  const spaceTest = {
    id: 'test-ezpaarse-id',
    name: 'test-ezpaarse-id',
    institutionId: '',
    type: 'ezpaarse',
    description: 'ezpaarse space for test institution',
    initials: 'EZ',
  };
  beforeAll(async () => {
    await login();
  });

  describe('eza spaces get <id>', () => {
    beforeAll(async () => {
      const { data } = await institutionsLib.create(institutionTest);
      institutionId = data?.id;
      spaceTest.institutionId = institutionId;
      await spacesLib.create(spaceTest);
    });
    it('Should get space', () => {
      const res = exec(commandFile, ['spaces', 'get', spaceTest.id, '--json']).toString();

      let space = res;

      [space] = JSON.parse(space);

      expect(space).toHaveProperty('id', spaceTest.id);
      expect(space).toHaveProperty('institutionId', institutionId);
      expect(space?.createdAt).not.toBeNull();
      expect(space?.updatedAt).not.toBeNull();
      expect(space).toHaveProperty('name', spaceTest.name);
      expect(space).toHaveProperty('description', spaceTest.description);
      expect(space).toHaveProperty('initials', spaceTest.initials);
      expect(space).toHaveProperty('color', null);
      expect(space).toHaveProperty('type', spaceTest.type);
      expect(space).toHaveProperty('indexPatterns', []);
    });

    afterAll(async () => {
      await spacesLib.delete(spaceTest.id);
      await institutionsLib.delete(institutionId);
    });
  });
});
