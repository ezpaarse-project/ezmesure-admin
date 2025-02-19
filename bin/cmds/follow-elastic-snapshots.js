const { i18n } = global;

const { MultiBar, Presets } = require('cli-progress');
const chalk = require('chalk');
const { formatDistanceToNow, formatDistance } = require('date-fns');

const { setTimeout } = require('node:timers/promises');

const elastic = require('../../lib/app/elastic');

exports.command = 'follow-elastic-snapshots <snapshotIds..>';
exports.desc = i18n.t('follow-elastic-snapshots.description');
exports.builder = (yargs) => yargs
  .option('r', {
    alias: 'repository',
    describe: i18n.t('follow-elastic-snapshots.options.repository'),
    type: 'string',
  });

const fetchSnapshot = async (repositoryId, snapshotId) => {
  // eslint-disable-next-line no-await-in-loop
  const { body: { snapshots: [snapshot] } } = await elastic.snapshot.status({
    repository: repositoryId,
    snapshot: snapshotId,
  });

  const value = snapshot.stats.processed?.size_in_bytes ?? snapshot.stats.total.size_in_bytes;
  const total = snapshot.stats.total.size_in_bytes;

  const elapsed = formatDistanceToNow(snapshot.stats.start_time_in_millis);
  const speed = Math.round(value / (snapshot.stats.time_in_millis / 1000));

  const remaining = formatDistance(0, ((total - value) / speed) * 1000);

  return {
    value,
    total,
    meta: {
      valueMo: (value / 1000000).toFixed(0),
      totalMo: (total / 1000000).toFixed(0),
      state: snapshot.state,
      elapsed,
      speed: (speed / 1000000).toFixed(0),
      remaining,
    },
  };
};

const followSnapshot = async (repositoryId, snapshotId, progress) => {
  let state = 'STARTED';
  while (state === 'STARTED') {
    const { value, total, meta } = await fetchSnapshot(repositoryId, snapshotId);

    progress.setTotal(total);
    progress.update(value, meta);
    state = meta.state;

    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }
};

exports.handler = async function handler(argv) {
  const { repository, snapshotIds, verbose } = argv;

  const multiBar = new MultiBar(
    { format: chalk.grey('{id} | {bar} | {percentage}% | {valueMo}/{totalMo}Mo | ETA: {remaining} | Elapsed: {elapsed} | {speed}Mo/s') },
    Presets.shades_classic,
  );

  const progresses = new Map();
  for (const id of snapshotIds) {
    const bar = multiBar.create(0, 0, { id });

    if (verbose) {
      multiBar.log(`${chalk.grey(`Following snapshot ${id}...`)}\n`);
    }

    progresses.set(
      id,
      followSnapshot(repository, id, bar),
    );
  }

  try {
    await Promise.all([...progresses.values()]);
    multiBar.stop();
  } catch (error) {
    console.error(`\n${chalk.red(error)}`);
    console.error(error.stack);
    process.exit(1);
  }
};
