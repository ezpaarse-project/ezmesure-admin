const { i18n } = global;

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const readline = require('readline');
const stream = require('stream');

const cliProgress = require('cli-progress');
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
    .option('interactive', {
      alias: 'i',
      describe: i18n.t('migrate.apply.options.interactive'),
      boolean: true,
      default: true,
    })
    .option('f', {
      alias: 'file',
      describe: i18n.t('migrate.apply.options.file'),
      type: 'string',
      default: 'migrate-cache.json',
    });
};

/**
 * Extract memberships of a legacy institution
 *
 * @param {Object} opts Various options
 * @param {Object} opts.institution Legacy institution processed
 * @param {Object[]} opts.spaces Spaces extracted from institution
 * @param {Object[]} opts.repositories Repos extracted from institution
 *
 * @returns {Object[]} Memberships of the institution
 */
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

      return {
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
            repositoryPattern: repo.pattern,
            readonly: isReadOnly,
            locked: roles.length > 0,
          }),
        ),
        locked: roles.length > 0,
      };
    },
  );
};

/**
 * Try to guess the type of repo/space, asking if not sure
 *
 * @param {Object} opts Various options
 * @param {"repo" | "space"} opts.type Type of entity processed
 * @param {string[]} opts.ids Ids of spaces/repos
 * @param {Object} opts.institution Legacy institution processed
 * @param {Object} opts.answers Cached answers
 * @param {boolean} opts.interactive Is the command is interactive
 *
 * @returns {Promise<Object>} Mapping between id and type of entity
 */
const getTypeOfSpacesOrRepos = async (opts) => {
  const unknownTypes = [];
  const res = {};

  let counterFound = false;
  for (const id of opts.ids) {
    let skip = false;
    let type;
    if (!type && opts.answers[opts.type][id]) {
      type = opts.answers[opts.type][id];
    }
    if (!type && /-publisher$/i.test(id)) {
      type = 'counter5';
      counterFound = true;
    }
    if (!type && /^ez[-_]/i.test(id)) {
      skip = true;
    }

    if (!skip && type !== '_') {
      if (type) {
        res[id] = type;
      } else {
        unknownTypes.push(id);
      }
    }
  }

  if (counterFound) {
    for (const id of unknownTypes) {
      res[id] = 'ezpaarse';
    }
    return res;
  }

  if (opts.interactive && unknownTypes.length > 0) {
    const skipSymbol = Symbol('skip option');

    const answers = await inquirer.prompt(
      unknownTypes.map(
        (id) => ({
          type: 'list',
          name: id,
          message: i18n.t(
            'migrate.apply.askRepoOrSpaceType.prompt',
            {
              id: chalk.red(id),
              type: chalk.underline(opts.type),
              institution: chalk.underline(opts.institution),
              ids: chalk.reset.grey(
                i18n.t(
                  'migrate.apply.askRepoOrSpaceType.idList',
                  {
                    type: opts.type,
                    ids: opts.ids.map((i) => {
                      const label = `${i} (${res[i] ?? '?'})`;
                      return (i === id ? chalk.red(label) : label);
                    }).join(', '),
                  },
                ),
              ),
            },
          ),
          choices: [
            'counter5',
            'ezpaarse',
            new inquirer.Separator(),
            { value: skipSymbol, name: i18n.t('migrate.apply.skip') },
            { value: '_', name: i18n.t('migrate.apply.ignore') },
          ],
        }),
      ),
    );

    for (const [key, value] of Object.entries(answers)) {
      if (value !== skipSymbol) {
        if (!opts.answers[opts.type]) {
          opts.answers[opts.type] = {};
        }

        opts.answers[opts.type][key] = value;
        res[key] = value;
      }
    }
  }

  return res;
};

/**
 * Shorthand to generate spaces from id, type and institution
 *
 * @param {Object} opts Various options
 * @param {string} opts.id Id of the space
 * @param {Object} opts.institution Legacy institution processed
 * @param {"ezpaarse" | "counter5"} opts.type Type of the repo
 *
 * @returns {Object} The space
 */
const genSpace = (opts) => {
  const typeLabel = opts.type === 'counter5' ? 'éditeur' : 'ezpaarse';

  let { name } = opts.institution;
  if (opts.institution.acronym) {
    name += ` (${opts.institution.acronym})`;
  }
  name += ` *${typeLabel}*`;

  return {
    id: opts.id,
    type: opts.type,
    name,
    description: `Espace ${typeLabel} (id: ${opts.id})`,
  };
};

/**
 * Extract spaces of a legacy institution, asking if unsure of the type
 *
 * @param {Object} opts Various options
 * @param {Object} opts.institution Legacy institution processed
 * @param {Object} opts.answers Cached answers
 * @param {boolean} opts.interactive Is the command is interactive
 *
 * @returns {Promise<Object[]>} List of spaces of an institution
 */
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
  const types = await getTypeOfSpacesOrRepos({
    type: 'space',
    ids,
    institution: opts.institution.name,
    interactive: opts.interactive,
    answers: opts.answers,
  });

  const spaces = ids.map(
    (id) => genSpace({
      id,
      institution: opts.institution,
      type: types[id],
    }),
  );
  return spaces.filter((s) => s?.type);
};

/**
 * Shorthand to generate repo from id and type
 *
 * @param {Object} opts Various options
 * @param {string} opts.id Pattern/Id of the repo
 * @param {"ezpaarse" | "counter5"} opts.type Type of the repo
 *
 * @returns {Object} The repo
 */
const genRepo = (opts) => ({
  pattern: opts.id,
  type: opts.type,
});

/**
 * Create missing repos, guessing from spaces, asking if unsure
 *
 * @param {Object} opts Various options
 * @param {Object} opts.institution Legacy institution processed
 * @param {Object[]} opts.spaces Spaces extracted from institution
 * @param {Object} opts.answers Cached answers
 * @param {boolean} opts.interactive Is the command is interactive
 *
 * @returns {Promise<Object[]>} List of created repos
 */
const createReposFromSpaces = async (opts) => {
  const cachedRepos = opts.answers.createdRepos[opts.institution.id] ?? [];
  const repos = [...opts.repositories, ...cachedRepos];

  const reposTypes = new Set(repos.map(({ type }) => type));
  const patterns = new Set(repos.map((r) => r.pattern));
  const missingRepos = opts.spaces
    .filter((s) => !reposTypes.has(s.type))
    .map((s) => genRepo({ id: `${s.id}*`, type: s.type }));

  const cachedReposPatterns = new Set(cachedRepos.map((r) => r.pattern));
  const choices = [...missingRepos, ...cachedRepos];

  if (!opts.interactive) {
    return cachedRepos;
  }

  const customSymbol = Symbol('custom option');
  const answers = await inquirer.prompt(
    [
      {
        type: 'confirm',
        name: 'confirm',
        message: i18n.t(
          'migrate.apply.askMoreRepos.ask',
          {
            institution: chalk.underline(opts.institution.name),
            ids: chalk.reset.grey(
              i18n.t(
                'migrate.apply.askMoreRepos.spacesList',
                {
                  ids: opts.spaces.map(
                    (s) => `${s.id} (${s.type})`,
                  ).join(', '),
                },
              ),
            ),
          },
        ),
        default: true,
        when: () => missingRepos.length > 0,
      },
      {
        type: 'checkbox',
        name: 'repos',
        message: i18n.t(
          'migrate.apply.askMoreRepos.prompt',
          {
            ids: chalk.reset.grey(i18n.t(
              'migrate.apply.askMoreRepos.patternList',
              {
                ids: repos.map(
                  (r) => `${chalk.reset.cyan(r.pattern)} ${chalk.grey(`(${r.type})`)}`,
                ).join(', '),
              },
            )),
          },
        ),
        choices: [
          ...choices
            .filter((r) => !patterns.has(r.pattern) || cachedReposPatterns.has(r.pattern))
            .map((r) => ({
              value: r.pattern,
              name: `${r.pattern} ${chalk.grey(`(${r.type})`)}`,
              checked: cachedReposPatterns.has(r.pattern),
            })),
          new inquirer.Separator(),
          { value: customSymbol, name: i18n.t('migrate.apply.create') },
        ],
        when: (ans) => ans.confirm,
      },
      {
        type: 'input',
        name: 'custom.pattern',
        message: 'Pattern:',
        when: (ans) => ans.confirm && ans.repos.includes(customSymbol),
      },
      {
        type: 'list',
        name: 'custom.type',
        message: 'Type:',
        choices: ['counter5', 'ezpaarse'],
        when: (ans) => ans.confirm && ans.repos.includes(customSymbol),
      },
    ],
  );

  if (!answers.confirm) {
    return cachedRepos;
  }

  let res = answers.repos
    .map((p) => {
      const missingRepo = missingRepos.find((r) => r.pattern === p);
      return missingRepo || cachedRepos.find((r) => r.pattern === p);
    })
    .filter((r) => !!r);

  if (answers.custom) {
    const newRepos = [
      ...res,
      answers.custom,
    ];

    res = [
      ...newRepos,
      // ask for more repos
      ...await createReposFromSpaces({
        ...opts,
        repositories: [
          ...opts.repositories,
          ...newRepos,
        ],
      }),
    ];
  }

  opts.answers.createdRepos[opts.institution.id] = res;
  return res;
};

/**
 * Extract repos of a legacy institution, asking if unsure of the type or if there's missing repos
 *
 * @param {Object} opts Various options
 * @param {Object} opts.institution Legacy institution processed
 * @param {Object[]} opts.spaces Spaces extracted from institution
 * @param {Object} opts.answers Cached answers
 * @param {boolean} opts.interactive Is the command is interactive
 *
 * @returns {Promise<Object[]>} List of repos of an institution
 */
const reposOfInstitution = async (opts) => {
  let ids = [];
  for (const role of opts.institution.roles) {
    const apps = role.indices;
    for (const { names } of apps) {
      ids = [...ids, ...names];
    }
  }

  ids = [...new Set(ids)];

  const types = await getTypeOfSpacesOrRepos({
    type: 'repo',
    ids,
    interactive: opts.interactive,
    institution: opts.institution.name,
    answers: opts.answers,
  });

  const repositories = ids.map(
    (id) => genRepo({
      id,
      type: types[id],
    }),
  );

  return [
    ...repositories,
    ...await createReposFromSpaces({
      institution: opts.institution,
      interactive: opts.interactive,
      spaces: opts.spaces,
      repositories,
      answers: opts.answers,
    }),
  ].filter((r) => r?.type && r.type !== '_');
};

/**
 * Transform legacy credential into a reloaded one
 *
 * @param {Object} cred Current credential processed
 *
 * @returns {Object} The new credential
 */
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

/**
 * Transform legacy user into a reloaded one
 *
 * @param {Object} user Current user processed
 *
 * @returns {Object} The new user
 */
const transformUser = (user) => ({
  username: user.username,
  fullName: user.full_name || '',
  email: (user.email || '').split(';')[0],
  metadata: user.metadata,
  isAdmin: user.roles.includes('superuser'),
});

/**
 * Transform legacy endpoint into a reloaded one
 *
 * @param {Object} endpoint Current endpoint processed
 *
 * @returns {Object} The new endpoint
 */
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

/**
 * Transform legacy institution into a reloaded one
 *
 * @param {Object} institution Current institution processed
 * @param {Object} opts Various options
 * @param {Object} opts.answers Cached answers
 * @param {boolean} opts.interactive Is the command is interactive
 *
 * @returns {Promise<Object>} The new institution
 */
const transformInstitution = async (institution, opts) => {
  const spaces = await spacesOfInstitution({
    institution,
    interactive: opts.interactive,
    answers: opts.answers,
  });

  const repositories = await reposOfInstitution({
    institution,
    spaces,
    interactive: opts.interactive,
    answers: opts.answers,
  });

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

/**
 * Read JSONL file line by line, parse content and write it into a PassThrough stream
 *
 * @param {string} filePath The path to the JSONL file
 *
 * @returns {stream.PassThrough}
 */
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

/**
 * Pipe given JSONL file into another JSONL file, transforming data row by row
 *
 * @param {Object} opts Various options
 * @param {string} opts.i18nKey i18n key to use to localise console logs
 * @param {boolean} opts.progressBar Should show progress bar. Disable if interactive
 * @param {(chunk: Object) => Promise<Object> | Object} opts.transformer The transformer
 * @param {string} opts.inFile Path to the input file
 * @param {string} opts.outFile Path to the output file
 *
 * @returns {Promise<void>} Promise is resolved when all input file is processed
 */
const transformJSONL = async (opts) => {
  console.log(chalk.blue(i18n.t(`migrate.apply.${opts.i18nKey}.going`)));
  console.group();

  let count = 0;
  let bar;

  if (opts.progressBar) {
    bar = new cliProgress.SingleBar(
      {
        format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
      },
      cliProgress.Presets.shades_classic,
    );
    bar.start(0, 0);
  }

  await new Promise((resolve, reject) => {
    const transformStream = new stream.Transform({
      objectMode: true,
      transform: (chunk, e, cb) => {
        bar?.setTotal(bar?.total + 1);
        Promise.resolve(opts.transformer(chunk))
          .then((res) => cb(null, res))
          .catch((err) => cb(err));
      },
    });

    const toJSONLStream = new stream.Transform({
      objectMode: true,
      transform: (chunk, e, cb) => {
        count += 1;
        bar?.increment();
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

  bar?.stop();
  console.log(chalk.green(i18n.t(`migrate.apply.${opts.i18nKey}.ok`, { count })));
  console.groupEnd();
};

exports.handler = async function handler(argv) {
  const {
    out,
    exportedpath,
    file,
    interactive,
  } = argv;
  const inFolder = path.resolve(exportedpath);

  if (!fs.existsSync(exportedpath)) {
    throw new Error(i18n.t('migrate.apply.noInDir'));
  }

  // prepare answer file
  const answerPath = path.resolve(file);
  let answers = { repo: {}, space: {}, createdRepos: {} };
  if (fs.existsSync(answerPath)) {
    answers = JSON.parse(await fsp.readFile(answerPath, 'utf-8'));
  }

  // prepare out folder
  let outFolder = path.resolve(out ?? '');
  if (!out) {
    outFolder = path.resolve(
      path.dirname(inFolder),
      `${path.basename(inFolder)}_migrated`,
    );
  }
  await fsp.mkdir(outFolder, { recursive: true });

  try {
    // Institution migration
    await transformJSONL({
      i18nKey: 'institutions',
      progressBar: !interactive,
      transformer: async (chunk) => {
        const inst = await transformInstitution(chunk, { answers, interactive });
        await fsp.writeFile(answerPath, JSON.stringify(answers, undefined, 4));
        return inst;
      },
      inFile: path.join(inFolder, 'institutions.jsonl'),
      outFile: path.join(outFolder, 'institutions.jsonl'),
    });

    // Users migration
    await transformJSONL({
      i18nKey: 'users',
      progressBar: true,
      transformer: (chunk) => transformUser(chunk),
      inFile: path.join(inFolder, 'dump/users.jsonl'),
      outFile: path.join(outFolder, 'users.jsonl'),
    });

    // Sushi migration
    await transformJSONL({
      i18nKey: 'sushi',
      progressBar: true,
      transformer: (chunk) => transformSushiEndpoint(chunk),
      inFile: path.join(inFolder, 'dump/depositors/sushi-endpoint.jsonl'),
      outFile: path.join(outFolder, 'sushis.jsonl'),
    });

    // Save types of repos and spaces
    await fsp.writeFile(answerPath, JSON.stringify(answers, undefined, 4));
    console.log(chalk.green(i18n.t('migrate.apply.answersOk', { out: chalk.underline(answerPath) })));

    console.log(chalk.green(i18n.t('migrate.apply.dataOk', { out: chalk.underline(outFolder) })));
  } catch (error) {
    const now = new Date();
    console.log(chalk.grey(i18n.t('migrate.apply.file', { type: 'error logs' })));
    await fsp.writeFile(path.join(outFolder, 'error.log'), `${now.toISOString()} error: ${error}`, 'utf-8');
    throw error;
  }
};
