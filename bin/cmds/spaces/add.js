const inquirer = require('inquirer');

const rolesLib = require('../../../lib/roles');
const spaces = require('../../../lib/spaces');
const { importOne, exportOne } = require('../../../lib/dashboard');
const { config } = require('../../../lib/app/config');

exports.command = 'add <space>';
exports.desc = 'Create new space';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Space name, case sensitive',
    type: 'string',
  })
    .option('c', {
      alias: 'color',
      type: 'string',
      describe: 'Space color',
    })
    .option('d', {
      alias: 'description',
      type: 'string',
      describe: 'Space description',
    })
    .option('i', {
      alias: 'initials',
      type: 'string',
      describe: 'Space initials',
    })
    .option('it', {
      alias: 'interactive',
      type: 'boolean',
      describe: 'Interactive mode',
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
        message: 'Enter space description',
      },
      {
        type: 'input',
        name: 'spaceInitials',
        message: 'Enter space initials',
      },
      {
        type: 'input',
        name: 'spaceColor',
        message: 'Enter space color (ex: #FF00FF)',
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
      console.log(`space [${space}] created successfully`);
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
    console.error(`role [${space.toLowerCase()}] does not exists, create with ezmesure-admin roles add ${space.toLowerCase()}`);
  }

  try {
    const templateSelected = config.dashboard.homepage || 'homepage';

    const { data: exportedDashboard } = await exportOne(templateSelected,
      config.space.template || null);

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
        console.log(`Problem with import ${dashboard.id} (id: ${templateSelected}) in ${space}`);
      }
      console.log(`dashboard [${dashboard.id} (id: ${templateSelected})] imported successfully`);
    }
  } catch (error) {
    console.log(error);
  }
};
