const { i18n } = global;

const Papa = require('papaparse');

const sushiLib = require('../../../lib/sushi');
const institutionsLib = require('../../../lib/institutions');

exports.command = 'sushi-matrix';
exports.desc = i18n.t('generate.sushiMatrix.description');
exports.builder = function builder(yargs) {
  return yargs;
};
exports.handler = async function handler() {
  let sushiPlatforms;
  let institutions;

  const HEADER_LINE = 0;
  const TOTAL_LINE = 1;
  const WORKING_LINE = 2;
  const FAULTY_LINE = 3;
  const UNTESTED_LINE = 4;

  const lines = [
    [''],
    ['Total SUSHI Credentials'],
    ['Working SUSHI credentials'],
    ['Faulty SUSHI credentials'],
    ['Untested SUSHI credentials'],
    [],
  ];

  try {
    institutions = await institutionsLib.getAll().then((res) => res?.data);
    sushiPlatforms = await sushiLib.getPlatforms().then((res) => res?.data);
  } catch (e) {
    const errorMessage = e?.response?.data?.error;
    const status = e?.response?.status;
    const statusMessage = e?.response?.statusMessage;

    console.error(`[${status}] ${errorMessage || statusMessage || e.message}`);
    process.exit(1);
  }

  const platformsByVendor = new Map();

  for (let institutionIndex = 0; institutionIndex < institutions.length; institutionIndex += 1) {
    const institution = institutions[institutionIndex];
    let sushiItems;

    const total = {
      working: 0,
      faulty: 0,
      untested: 0,
    };

    try {
      sushiItems = await institutionsLib.getSushi(institution.id).then((res) => res?.data);
    } catch (e) {
      const errorMessage = e?.response?.data?.error;
      const status = e?.response?.status;
      const statusMessage = e?.response?.statusMessage;

      console.error(`[${status}] ${errorMessage || statusMessage || e.message}`);
      process.exit(1);
    }

    sushiItems.forEach((sushiItem) => {
      const vendor = sushiItem?.vendor?.toLowerCase?.();
      if (!vendor) { return; }

      if (!platformsByVendor.has(vendor)) {
        platformsByVendor.set(vendor, { name: sushiItem.vendor, items: [] });
      }

      const { items } = platformsByVendor.get(vendor);

      if (!items[institutionIndex]) {
        items[institutionIndex] = { working: 0, faulty: 0, untested: 0 };
      }

      const institutionItems = items[institutionIndex];

      if (sushiItem?.connection?.success === true) {
        institutionItems.working += 1;
        total.working += 1;
      } else if (sushiItem?.connection?.success === false) {
        institutionItems.faulty += 1;
        total.faulty += 1;
      } else {
        institutionItems.untested += 1;
        total.untested += 1;
      }
    });

    lines[HEADER_LINE][institutionIndex + 1] = institution.name;
    lines[TOTAL_LINE][institutionIndex + 1] = sushiItems.length;
    lines[WORKING_LINE][institutionIndex + 1] = total.working;
    lines[FAULTY_LINE][institutionIndex + 1] = total.faulty;
    lines[UNTESTED_LINE][institutionIndex + 1] = total.untested;
  }

  sushiPlatforms.forEach((platform) => {
    const vendor = platform.name?.toLowerCase?.();
    if (!vendor) { return; }

    if (!platformsByVendor.has(vendor)) {
      platformsByVendor.set(vendor, { name: platform.name, items: [] });
    }
  });

  const vendorLines = Array.from(platformsByVendor.values())
    .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
    .map(({ name, items }) => {
      const columns = items.map((item) => {
        const { working = 0, faulty = 0, untested = 0 } = item || {};

        const total = working + faulty + untested;

        if (total > 0) {
          if ((faulty + untested) === 0) { return 'working'; }
          if ((working + untested) === 0) { return 'faulty'; }
          if ((working + faulty) === 0) { return 'untested'; }
          return 'mixed';
        }

        return '';
      });

      return [name, ...columns];
    });

  console.log(Papa.unparse([...lines, ...vendorLines]));
};
