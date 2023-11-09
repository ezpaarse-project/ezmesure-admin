const { i18n } = global;

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const readline = require('readline');
const stream = require('stream');

const chalk = require('chalk');
const inquirer = require('inquirer');

exports.command = 'apply <exported path>';
exports.desc = i18n.t('migrate.apply.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('o', {
      alias: 'out',
      describe: i18n.t('migrate.apply.options.out'),
      type: 'string',
    })
    .option('f', {
      alias: 'file',
      describe: i18n.t('migrate.apply.options.file'),
      type: 'string',
      default: 'space-repo-type-answers.json',
    });
};

const membershipsByUser = {};

const membershipsOfInstitution = (opts) => {
  const features = [
    'institution',
    'memberships',
    'sushi',
    'reporting',
  ];

  return opts.institution.members.map(
    (member) => {
      const roles = [];
      const rawRoles = new Set(member.roles);
      if (rawRoles.has('doc_contact')) {
        roles.push('contact:doc');
      }
      if (rawRoles.has('tech_contact')) {
        roles.push('contact:tech');
      }

      const isReadOnly = rawRoles.has(`${opts.institution.role}_read_only`);
      let permissions = features.map((f) => `${f}:read`);
      if (!isReadOnly) {
        permissions = [...permissions, ...features.map((f) => `${f}:write`)];
      }

      const membership = {
        username: member.username,
        roles,
        permissions,
        spacePermissions: opts.spaces.map(
          (space) => ({
            spaceId: space.id,
            readonly: isReadOnly,
            locked: roles.length > 0,
          }),
        ),
        repositoryPermissions: opts.repositories.map(
          (repo) => ({
            pattern: repo.pattern,
            readonly: isReadOnly,
            locked: roles.length > 0,
          }),
        ),
        locked: roles.length > 0,
      };

      // Keep it so we can add it to user
      membershipsByUser[member.username] = [
        ...(membershipsByUser[member.username] ?? []),
        { ...membership, username: undefined, institutionId: opts.institution.id },
      ];

      return membership;
    },
  );
};

const getTypeOfSpacesOrRepos = async (opts) => {
  const unknownTypes = [];
  let res = {};

  let counterFound = false;
  for (const id of opts.ids) {
    let type;
    if (!type && opts.answers[opts.type][id]) {
      type = opts.answers[opts.type][id];
    }
    if (!type && /-publisher$/i.test(id)) {
      type = 'counter5';
      counterFound = true;
    }

    if (type) {
      res[id] = type;
    } else {
      unknownTypes.push(id);
    }
  }

  if (counterFound) {
    for (const id of unknownTypes) {
      res[id] = 'ezpaarse';
    }
    return res;
  }

  if (unknownTypes.length > 0) {
    const answers = await inquirer.prompt(
      unknownTypes.map(
        (id) => ({
          type: 'list',
          name: id,
          // TODO: better message, add list of ids
          message: `ASK FOR ${opts.type} TYPE of: ${id}`,
          choices: ['counter5', 'ezpaarse'],
        }),
      ),
    );

    opts.answers[opts.type] = {
      ...(opts.answers[opts.type] ?? {}),
      ...answers,
    };
    res = {
      ...res,
      ...answers,
    };
  }

  return res;
};

const spacesOfInstitution = async (opts) => {
  const bannedSpaces = new Set(['space:bienvenue', 'space:default']);
  let ids = [];
  for (const role of opts.institution.roles) {
    const apps = role.applications.filter((a) => a.application === 'kibana-.kibana');
    for (const { resources } of apps) {
      ids = [
        ...ids,
        ...resources
          .filter((r) => /^space:/i.test(r) && !bannedSpaces.has(r))
          .map((r) => r.split(':')[1]),
      ];
    }
  }

  ids = [...new Set(ids)];
  const types = await getTypeOfSpacesOrRepos({ type: 'space', ids, answers: opts.answers });
  return ids.map(
    (id) => {
      const type = types[id];
      const typeLabel = type === 'counter5' ? 'éditeur' : 'ezpaarse';

      let { name } = opts.institution;
      if (opts.institution.acronym) {
        name += ` (${opts.institution.acronym})`;
      }
      name += ` *${typeLabel}*`;

      return {
        id,
        type,
        name,
        description: `Espace ${typeLabel} (id: ${id})`,
      };
    },
  );
};

const reposOfInstitution = async (opts) => {
  let ids = [];
  for (const role of opts.institution.roles) {
    const apps = role.indices;
    for (const { names } of apps) {
      ids = [...ids, ...names];
    }
  }

  ids = [...new Set(ids)];

  const types = await getTypeOfSpacesOrRepos({ type: 'repo', ids, answers: opts.answers });
  return ids.map(
    (id) => ({
      pattern: id,
      type: types[id],
    }),
  );
};

const transformSushiCred = (cred) => ({
  id: cred.id,
  customerId: cred.customerId,
  requestorId: cred.requestorId,
  apiKey: cred.apiKey,
  comment: cred.comment,
  endpointId: cred.endpointId,
  params: cred.params,
  connection: {},
  tags: [],
});

const transformUser = (user) => ({
  username: user.username,
  fullName: user.full_name,
  email: user.email,
  metadata: user.metadata,
  isAdmin: user.roles.includes('superuser'),
  memberships: membershipsByUser[user.username],
});

const transformSushiEndpoint = (endpoint) => ({
  id: endpoint.id,
  sushiUrl: endpoint.sushiUrl,
  vendor: endpoint.vendor,
  description: endpoint.description,
  counterVersion: endpoint.counterVersion,
  technicalProvider: endpoint.technicalProvider,
  requireCustomerId: endpoint.requireCustomerId,
  requireRequestorId: endpoint.requireRequestorId,
  requireApiKey: endpoint.requireApiKey,
  ignoreReportValidation: endpoint.ignoreReportValidation,
  paramSeparator: endpoint.paramSeparator,
  params: endpoint.params,
  tags: endpoint.tags,
  defaultCustomerId: '',
  defaultRequestorId: '',
  defaultApiKey: '',
});

const transformInstitution = async (institution, opts) => {
  const spaces = await spacesOfInstitution({ institution, answers: opts.answers });
  const repositories = await reposOfInstitution({ institution, answers: opts.answers });

  return {
    id: institution.id,
    name: institution.name,
    logoId: institution.logoId,
    type: institution.type,
    acronym: institution.acronym,
    websiteUrl: institution.website,
    city: institution.city,
    uai: institution.uai,
    sushiReadySince: institution.sushiReadySince,
    validated: institution.validated || false,
    hidePartner: institution.hidePartner || false,
    social: {
      youtubeUrl: institution.youtubeUrl,
      linkedinUrl: institution.linkedinUrl,
      facebookUrl: institution.facebookUrl,
      twitterUrl: institution.twitterUrl,
    },
    parentInstitutionId: undefined,
    tags: [],
    auto: {},

    sushiCredentials: institution.sushi.map((cred) => transformSushiCred(cred)),
    spaces,
    repositories,
    memberships: membershipsOfInstitution({ institution, spaces, repositories }),
  };
};

const JSONL2Stream = (filePath) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const s = new stream.PassThrough({ objectMode: true });
  rl.on('line', (line) => {
    s.write(JSON.parse(line));
  });
  rl.on('close', () => s.end());

  return s;
};

const transformJSONL = (opts) => new Promise((resolve, reject) => {
  const transformStream = new stream.Transform({
    objectMode: true,
    transform: (chunk, e, cb) => {
      Promise.resolve(opts.transformer(chunk, ...(opts.transformerParams ?? [])))
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
    },
  });

  const toJSONLStream = new stream.Transform({
    objectMode: true,
    transform: (chunk, e, cb) => {
      cb(null, `${JSON.stringify(chunk)}\n`);
    },
  });

  JSONL2Stream(opts.inFile)
    .pipe(transformStream)
    .pipe(toJSONLStream)
    .pipe(fs.createWriteStream(opts.outFile))
    .on('close', () => resolve())
    .on('error', (err) => reject(err));
});

exports.handler = async function handler(argv) {
  const { out, exportedpath, file } = argv;
  const inFolder = path.resolve(exportedpath);

  // TODO: check folder

  // prepare answer file
  const answerPath = path.resolve(file);
  let answers = { repo: [], space: [] };
  if (fs.existsSync(answerPath)) {
    answers = JSON.parse(await fsp.readFile(answerPath, 'utf-8'));
    // TODO: validation
  }

  // prepare out folder
  let outFolder = path.resolve(out ?? '');
  if (!out) {
    outFolder = path.resolve(
      path.dirname(inFolder),
      `${path.basename(inFolder)}-migrated`,
    );
  }
  await fsp.mkdir(outFolder, { recursive: true });

  // Do institution migration
  console.log(chalk.grey('[institutions] Migrating institutions...'));
  await transformJSONL({
    transformer: transformInstitution,
    transformerParams: [{ answers }],
    inFile: path.join(inFolder, 'institutions.jsonl'),
    outFile: path.join(outFolder, 'institutions.jsonl'),
  });
  console.log(chalk.green('[institutions]  Institutions migrated !'));

  // Start users migration
  console.log(chalk.grey('[users] Migrating users...'));
  const userPromise = transformJSONL({
    transformer: transformUser,
    // transformerParams: [],
    inFile: path.join(inFolder, 'dump/users.jsonl'),
    outFile: path.join(outFolder, 'users.jsonl'),
  }).then(() => console.log(chalk.green('[users]  Users migrated !')));

  // Start sushi migration
  console.log(chalk.grey('[sushis] Migrating sushi endpoints...'));
  const sushiPromise = transformJSONL({
    transformer: transformSushiEndpoint,
    // transformerParams: [],
    inFile: path.join(inFolder, 'dump/depositors/sushi-endpoint.jsonl'),
    outFile: path.join(outFolder, 'sushis.jsonl'),
  }).then(() => console.log(chalk.green('[sushis]  Sushi endpoints migrated !')));

  // Await all streams
  await Promise.all([userPromise, sushiPromise]);

  // Save types of repos and spaces
  await fsp.writeFile(answerPath, JSON.stringify(answers, undefined, 4));
  console.log(chalk.green(` Answers saved to "${chalk.underline(answerPath)}"`));

  console.log(chalk.green(` Data migrated to "${chalk.underline(outFolder)}"`));
};
