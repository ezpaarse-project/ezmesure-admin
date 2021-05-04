const path = require('path');
const get = require('lodash.get');

class I18n {
  constructor({ locales, directory, default: defaultLocale }) {
    this.locales = Array.isArray(locales) ? locales : [locales];
    this.directory = directory ? path.resolve(directory) : path.resolve(__dirname, '..', '..', 'locales');
    this.default = defaultLocale || 'en';
    this.localesData = {};

    this.loadLocales();

    this.t = this.translate;
  }

  loadLocales() {
    for (let i = 0; i < this.locales.length; i += 1) {
      try {
        const file = path.join(this.directory, `${this.locales[i]}.json`);

        // eslint-disable-next-line
        this.localesData[this.locales[i]] = require(file);
      } catch (error) {
        console.error(error);
      }
    }
  }

  translate(key, data = null) {
    let sentence = get(this.localesData[this.default], key) || key;

    if (data) {
      sentence = sentence.replace(/{{(\w+)}}/g, (param, value) => data[value] || param);
    }

    return sentence;
  }
}

I18n.I18n = I18n;
I18n.default = I18n;
module.exports = I18n;
