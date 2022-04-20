const path = require('path');
const get = require('lodash.get');

class I18n {
  constructor({ locales, directory, default: defaultLocale }) {
    const localeLang = process?.env?.LANG?.substr(0, 2);

    this.locales = Array.isArray(locales) ? locales : [locales];

    this.directory = directory ? path.resolve(directory) : path.resolve(__dirname, '..', '..', 'locales');

    this.localesData = this.loadLocales();

    if (this.localesData[defaultLocale]) {
      this.default = defaultLocale;
    } else if (this.localesData[localeLang]) {
      this.default = localeLang;
    } else {
      this.default = 'en';
    }

    this.t = this.translate;
  }

  loadLocales() {
    const locales = {};
    for (let i = 0; i < this.locales.length; i += 1) {
      try {
        const file = path.join(this.directory, `${this.locales[i]}.json`);

        // eslint-disable-next-line
        locales[this.locales[i]] = require(file);
      } catch (error) {
        console.error(error);
      }
    }

    return locales;
  }

  has(key) {
    return !!get(this.localesData[this.default], key);
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
