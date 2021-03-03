const { table } = require('table');
const chalk = require('chalk');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const uuid = require('uuid');
const logger = require('../../lib/app/logger');
const institutionLib = require('../../lib/institutions');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

module.exports = {
  list: async (institutionName) => {
    let data;
    try {
      const { body } = await institutionLib.getInstitutions();
      // eslint-disable-next-line prefer-destructuring
      data = body.hits.hits;
    } catch (error) {
      logger.info(`Institution ${institutionName} non trouvée`);
      return process.exit(1);
    }

    if (!data || (data && !data.length)) {
      logger.info('Aucune données trouvées.');
      return process.exit(0);
    }

    if (institutionName) {
      // eslint-disable-next-line max-len
      const institution = data.find(({ _source: src }) => src.institution.name.toLowerCase() === institutionName.toLowerCase());

      if (!institution) {
        logger.info(`Institution ${institutionName} non trouvée`);
        return process.exit(0);
      }

      if (institution) {
        const { _source: source } = institution;
        console.log(`${chalk.bold('Name')}:      ${source.institution.name}`);
        console.log(`${chalk.bold('Acronym')}:    ${source.institution.acronym}`);
        console.log(`${chalk.bold('Site')}:     ${source.institution.website}`);
        console.log(`${chalk.bold('City')}:    ${source.institution.city}`);
        console.log(`${chalk.bold('Type')}:     ${source.institution.type}`);
        console.log(`${chalk.bold('Auto')}:`);
        console.log(`  - ${chalk.bold('ezPAARSE')}: ${source.institution.auto.ezpaarse ? 'OK' : ''}`);
        console.log(`  - ${chalk.bold('ezMESURE')}: ${source.institution.auto.ezmesure ? 'OK' : ''}`);
        console.log(`  - ${chalk.bold('Reporting')}: ${source.institution.auto.report ? 'OK' : ''}`);
        console.log(`${chalk.bold('Domains')}: ${source.institution.domains.join(', ')}`);
        const members = source.institution.members.map(({ username, type }) => `\n  - ${chalk.bold('User')}: ${username}\n  - ${chalk.bold('Type')}: ${type.join(', ') || ''}`);
        console.log(`${chalk.bold('Members')}:  ${members}`);
      }
      return process.exit(0);
    }

    const header = ['Name', 'Acronym', 'Site', 'City', 'Type', 'Automatisation', 'Domains', 'Members'];

    data = Array.isArray(data) ? data : [data];

    const lines = data.map(({ _source: source }) => {
      const { institution } = source;
      const members = institution.members.map(({ username, type }) => `${username} (${type.join(', ') || ''})`);
      return [
        institution.name,
        institution.acronym,
        institution.website,
        institution.city,
        institution.type,
        `ezPAARSE: ${institution.auto.ezpaarse ? 'OK' : ''}\nezMESURE: ${institution.auto.ezmesure ? 'OK' : ''}\nReporting: ${institution.auto.report ? 'OK' : ''}`,
        institution.domains.join('\n'),
        members.join('\n'),
      ];
    });
    console.log(table([header, ...lines]));

    return process.exit(0);
  },

  del: async () => {
    let data;
    try {
      const { body } = await institutionLib.getInstitutions();
      // eslint-disable-next-line prefer-destructuring
      data = body.hits.hits;
    } catch (error) {
      logger.info('Institutions non trouvées');
      return process.exit(1);
    }

    data = Array.isArray(data) ? data : [data];

    const institutions = data.map(({ _source: source }) => source.institution.name);

    const { institutionsName } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'institutionsName',
      message: 'Institutions',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        resolve(institutions.filter((indice) => indice.includes(input)));
      }),
    }]);

    const institutionsId = [];
    data.forEach(({ _id: id, _source: source }) => {
      if (institutionsName.includes(source.institution.name)) {
        institutionsId.push({
          id,
          name: source.institution.name,
        });
      }
    });

    if (institutionsId.length) {
      for (let i = 0; i < institutionsId.length; i += 1) {
        try {
          await institutionLib.delInstitutions(institutionsId[i].id);
          logger.info(`L'institution ${institutionsId[i].name} est supprimée`);
        } catch (e) {
          logger.error(`Impossible de supprimer l'institution ${institutionsId[i].name}`);
        }
      }
    }

    return process.exit(0);
  },

  add: async () => {
    let result;

    try {
      result = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Institution name',
        },
        {
          type: 'input',
          name: 'acronym',
          message: 'Acronym',
        },
        {
          type: 'input',
          name: 'website',
          message: 'Website',
        },
        {
          type: 'input',
          name: 'city',
          message: 'City',
        },
        {
          type: 'input',
          name: 'type',
          message: 'Type',
        },
        {
          type: 'input',
          name: 'uai',
          message: 'UAI',
        },
        {
          type: 'input',
          name: 'domains',
          message: 'Domains (e.g.: inst.fr,cnrs.fr)',
        },
        {
          type: 'input',
          name: 'index',
          message: 'Index',
        },
        {
          type: 'checkbox-plus',
          name: 'auto',
          message: 'Automatisation',
          searchable: true,
          highlight: true,
          source: (answersSoFar, input) => new Promise((resolve) => {
            input = input || '';

            resolve(['ezPAARSE', 'ezMESURE', 'Reporting'].filter((service) => service.includes(input)));
          }),
        },
      ]);
    } catch (e) {
      console.error(e);
      logger.error(e);
      return process.exit(1);
    }

    if (result) {
      if (result.auto.length) {
        const auto = {
          ezpaarse: result.auto.includes('ezPAARSE'),
          ezmesure: result.auto.includes('ezMESURE'),
          report: result.auto.includes('Reporting'),
        };
        result.auto = auto;
      }

      const currentData = new Date();

      const currentId = uuid.v1();
      const id = `institution:${currentId}`;
      const doc = {
        type: 'institution',
        institution: {
          id: currentId,
          auto: result.auto,
          name: result.name,
          city: result.city,
          uai: result.uai,
          acronym: result.acronym,
          website: result.website,
          type: result.type,
          validated: true,
          indexPrefix: result.index,
          indexCount: 0,
          domains: result.domains.split(','),
          members: [],
          updatedAt: currentData,
          createdAt: currentData,
        },
      };

      try {
        const { statusCode } = await institutionLib.addInstitutions(id, doc);
        if (statusCode === 201) {
          logger.info('Institution créée avec succès');
        }
      } catch (e) {
        logger.error('Impossible de créer l\'institution');
        console.error(e);
        process.exit(1);
      }
    }

    return process.exit(0);
  },
};
