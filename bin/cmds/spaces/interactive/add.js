const { i18n } = global;

const inquirer = require('inquirer');

module.exports = async function it() {
  return inquirer.prompt([
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
};
