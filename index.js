#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable max-len */

const program = require('commander');
const pkg = require('./package.json');

const libSpaces = require('./lib/app/spaces');
const objects = require('./lib/app/objects');
const dashboard = require('./lib/app/dashboard');

program.on('command:*', () => {
  console.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
  process.exit(1);
});

program
  .version(pkg.version)
  .command('spaces [space]')
  .option('-a, --all', 'display all data')
  .option('-j, --json', 'display data in JSON format')
  .description('List all KIBANA spaces or [space] space attributes')
  .action((space, opts) => {
    libSpaces.getSpaces(space, opts);
  });

program
  .command('space-add <space>')
  .option('-c, --color <color>', 'color of space')
  .option('-d, --desc <description>', 'description of space')
  .option('-i, --initials <initials>', 'initials of space')
  .description('Add a KIBANA space with default attributes')
  .action((space, opts) => {
    libSpaces.addSpaces(space, opts);
  });

program
  .command('space-del <spaces...>')
  .description('Delete a KIBANA space')
  .action((spaces) => {
    libSpaces.delSpaces(spaces);
  });

program
  .command('objects-find <type>')
  .description('Find KIBANA objects (objects: visualization, dashboard, search, index-pattern, config, timelion-sheet)')
  .option('-t, --title <title>', 'title (ex: univ-lorraine)')
  .option('-j, --json', 'display data in JSON format')
  .option('-s, --space <space>', 'name of target space')
  .action((type, opts) => {
    objects.findObjects(type, opts);
  });

program
  .command('dashboard-export <dashboardId>')
  .description('Export dashboard by Id')
  .option('-s, --space <space>', 'name of target space')
  .action((dashboardId) => {
    dashboard.exportDashboard(dashboardId);
  });

program
  .command('dashboard-move-in-space <dashboardId> <space>')
  .description('Move dashboard by Id in another space')
  .option('-n, --new', 'create new space')
  .action((dashboardId, space, opts) => {
    dashboard.importDashboardInSpace(dashboardId, space, opts);
  });

program.parse(process.argv);
