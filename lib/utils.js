const { i18n } = global;
const chalk = require('chalk');
const { table } = require('table');
const get = require('lodash.get');
const {
  format: formatDate,
  parseISO: parseDate,
  isValid: dateIsValid,
  intervalToDuration,
} = require('date-fns');

exports.formatApiError = (e, options = {}) => {
  const errorMessage = e?.response?.data?.message || e?.response?.data?.error;
  const status = e?.response?.status;
  const statusText = e?.response?.statusText;
  let prefix = '';

  if (typeof options.prefix === 'string') {
    prefix = options.prefix;
  } else if (options.prefix !== false) {
    prefix = options.colorize === false ? 'Error: ' : chalk.red('Error: ');
  }

  if (errorMessage) {
    return `${prefix}${errorMessage}`;
  }
  if (status && statusText) {
    return `${prefix}${status} ${statusText}`;
  }

  return `${prefix}${e.stack}`;
};

exports.tableDisplay = () => {
  let fieldsKey;
  let fields;

  return {
    /**
     * Register the --fields and --available--fields options
     * Also add a middleware that show available fields and
     * exit if he --available-fields flag is present
     */
    register(yargs, options = {}) {
      const {
        key = 'f',
        alias = 'fields',
        availableFields = [],
      } = options;

      fieldsKey = key;

      yargs.middleware((argv) => {
        if (argv?.availableFields) {
          availableFields?.forEach((f) => console.log(f));
          process.exit(0);
        }

        fields = argv?.[fieldsKey];
      });

      return yargs
        .option('available-fields', {
          describe: i18n.t('global.options.availableFields'),
          type: 'boolean',
        })
        .option(key, {
          alias,
          describe: i18n.t('global.options.fields'),
          type: 'array',
          coerce: (array) => array.flatMap((v) => v.split(',')),
        });
    },

    /**
     * Print the given items with a table layout
     * @param {Array<Object>} items the list of items to be displayed
     * @param {*} options
     */
    print(items, options = {}) {
      const {
        formats = {},
        headerTranslateKey = (x) => x,
        defaultFields,
      } = options;

      if (!Array.isArray(fields) || fields.length === 0) {
        fields = defaultFields.slice();
      }

      const header = fields.map((field) => {
        const fieldKey = headerTranslateKey(field);
        return i18n.has(fieldKey) ? i18n.t(fieldKey) : field;
      });

      const lines = items.map((task) => fields.map((field) => {
        const value = get(task, field);
        const format = formats[field];

        if (format?.type === 'date') {
          const date = parseDate(value);
          return dateIsValid(date) ? formatDate(date, format?.format || 'Pp') : '';
        }

        if (format?.type === 'duration') {
          const msValue = Number.parseInt(value, 10);

          if (!Number.isInteger(msValue)) { return ''; }

          const {
            years,
            months,
            days,
            hours,
            minutes,
            seconds,
          } = intervalToDuration({ start: 0, end: msValue });

          const duration = [];

          if (years) { duration.push(`${years}y`); }
          if (duration.length || months) { duration.push(`${months}M`); }
          if (duration.length || days) { duration.push(`${days}d`); }
          if (duration.length || hours) { duration.push(`${hours}h`); }
          if (duration.length || minutes) { duration.push(`${minutes}m`); }
          if (duration.length || seconds) { duration.push(`${seconds}s`); }
          if (duration.length === 0) { duration.push(`${msValue}ms`); }

          return duration.join(' ');
        }

        if (/^#([a-f0-9]{6}|[a-f0-9]{3})$/i.test(value)) {
          return chalk.hex(value)(value);
        }

        if (format?.type === 'colorize') {
          // Colors should be chalk instances
          const color = format?.colors?.[value];
          if (typeof color === 'function') { return color(value); }
          if (typeof format?.default === 'function') { return format.default(value); }
          return value;
        }

        if (typeof value === 'boolean') {
          return value ? chalk.green('Yes') : chalk.red('No');
        }
        if (typeof value === 'number') {
          return value.toString();
        }

        return value || '';
      }));

      console.log(table([header, ...lines]));
    },
  };
};
