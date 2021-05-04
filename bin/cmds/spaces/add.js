const { i18n } = global;

const inquirer = require('inquirer');

const rolesLib = require('../../../lib/roles');
const spaces = require('../../../lib/spaces');
const { importOne, exportOne } = require('../../../lib/dashboard');
const { config } = require('../../../lib/app/config');

exports.command = 'add <space>';
exports.desc = i18n.t('spaces.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('spaces.add.options.space'),
    type: 'string',
  })
    .option('c', {
      alias: 'color',
      type: 'string',
      describe: i18n.t('spaces.add.options.color'),
    })
    .option('d', {
      alias: 'description',
      type: 'string',
      describe: i18n.t('spaces.add.options.description'),
    })
    .option('i', {
      alias: 'initials',
      type: 'string',
      describe: i18n.t('spaces.add.options.initials'),
    })
    .option('it', {
      alias: 'interactive',
      type: 'boolean',
      describe: i18n.t('spaces.add.options.interactive'),
    });
};
exports.handler = async function handler(argv) {
  const {
    space, color, description, initials, interactive,
  } = argv;

  const options = {
    id: space.toLowerCase(),
    name: space,
    color,
    description: description || 'homepage',
    initials,
  };

  if (interactive) {
    const { spaceDescr, spaceInitials, spaceColor } = await inquirer.prompt([
      {
        type: 'input',
        name: 'spaceDescr',
        message: i18n.t('spaces.add.spaceDescription'),
      },
      {
        type: 'input',
        name: 'spaceInitials',
        message: i18n.t('spaces.add.spaceInitials'),
      },
      {
        type: 'input',
        name: 'spaceColor',
        message: i18n.t('spaces.add.spaceColor'),
      },
    ]);

    options.description = spaceDescr;
    options.initials = spaceInitials;
    options.color = spaceColor;
  }

  try {
    await spaces.build(options);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  try {
    const res = await spaces.add(options);
    if (res && res.status === 200) {
      console.log(i18n.t('spaces.add.created', { space }));
    }
  } catch (error) {
    if (error && error?.response && error?.response?.data) {
      console.log(`[Error#${error.response.data.statusCode}] ${error.response.data.message}`);
      process.exit(1);
    }

    console.log(error);
    process.exit(1);
  }

  try {
    await rolesLib.findByName(space.toLowerCase());
  } catch (erorr) {
    console.error(i18n.t('spaces.add.roleDoesNotExists', { role: space.toLowerCase() }));
  }

  try {
    const templateSelected = config.dashboard.homepage || 'homepage';

    const { data: exportedDashboard } = await exportOne(templateSelected,
      config.space.template || null);

    if (!exportedDashboard) {
      console.log(i18n.t('spaces.add.dashboardDoesNotExists', { dashboard: templateSelected }));
      process.exit(1);
    }

    if (exportedDashboard && exportedDashboard.objects) {
      const indexPattern = Object.values(exportedDashboard.objects)
        .find((object) => object.type === 'index-pattern');

      indexPattern.attributes.title = space;

      const dashboard = Object.values(exportedDashboard.objects)
        .find((object) => object.type === 'dashboard');

      if (dashboard) {
        dashboard.id = 'homepage';
      }

      const objects = await importOne(space.toLowerCase(), exportedDashboard);
      if (objects.status !== 200) {
        console.log(i18n.t('spaces.add.importError', { dashboardId: dashboard.id, templateSelected, space }));
      }
      console.log(i18n.t('spaces.add.imported', { dashboardId: dashboard.id, templateSelected }));
    }
  } catch (error) {
    console.log(error);
  }
};
