const { i18n } = global;

const chalk = require('chalk');

exports.printSystemctlStyle = (data) => {
  const entries = Object.entries(data);
  let maxLen = 0;
  for (const [header] of entries) {
    maxLen = Math.max(maxLen, header.length);
  }

  for (const [header, value] of entries) {
    let v = value;
    let items;
    let def;
    if (typeof value === 'object') {
      v = value.value;
      def = value.def;
      items = value.items;
    }

    if (v === undefined) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const h = i18n.t(`harvest.status.${header}`).padStart(maxLen + 1, ' ');
    console.log(`${h}: ${v === def ? chalk.grey(v) : v}`);

    if (items?.length > 0) {
      for (let i = 0; i < items.length; i += 1) {
        const element = items[i];
        const prefix = i === items.length - 1 ? '└─' : '├─';
        console.log(`${' '.repeat(maxLen + 1)}${prefix}${element.header} ${element.value}`);
      }
    }
  }
};
