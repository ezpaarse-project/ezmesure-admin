const { i18n } = global;

const { MultiBar, Presets } = require('cli-progress');
const chalk = require('chalk');
const { formatDistanceToNow, formatDistance } = require('date-fns');

const { setTimeout } = require('node:timers/promises');

const elastic = require('../../lib/app/elastic');

exports.command = 'follow-elastic-tasks <taskIds..>';
exports.desc = i18n.t('follow-elastic-tasks.description');
exports.builder = (yargs) => yargs;

const fetchTask = async (taskId) => {
  // eslint-disable-next-line no-await-in-loop
  const { body: { completed, task } } = await elastic.tasks.get({ taskId });

  const fields = ['created', 'deleted', 'updated'];
  const value = fields.reduce((acc, field) => { acc += task.status[field]; return acc; }, 0);

  const elapsed = formatDistanceToNow(task.start_time_in_millis);
  const speed = Math.round(value / (task.running_time_in_nanos * 1e-9));

  const rem = ((task.status.total - value) / speed) * 1000;
  const remaining = rem >= 60 ? formatDistance(0, rem) : 'Ended';

  return {
    task,
    value,
    meta: {
      completed,
      elapsed,
      speed,
      remaining,
    },
  };
};

const followTask = async (taskId, progress) => {
  let completed = false;
  while (!completed) {
    const { task, value, meta } = await fetchTask(taskId);

    progress.setTotal(task.status.total);
    progress.update(value, meta);
    completed = meta.completed;

    // eslint-disable-next-line no-await-in-loop
    await setTimeout(1000);
  }
};

exports.handler = async function handler(argv) {
  const { taskIds, verbose } = argv;

  const multiBar = new MultiBar(
    {
      format: chalk.grey('{id} | {bar} | {percentage}% | {value}/{total} | ETA: {remaining} | Elapsed: {elapsed} | {speed}/s'),
    },
    Presets.shades_classic,
  );

  const progresses = new Map();
  for (const id of taskIds) {
    const bar = multiBar.create(0, 0, { id });

    if (verbose) {
      multiBar.log(`${chalk.grey(`Following task ${id}...`)}\n`);
    }

    progresses.set(
      id,
      followTask(id, bar),
    );
  }

  try {
    await Promise.all([...progresses.values()]);
    multiBar.stop();
  } catch (error) {
    console.error(`\n${chalk.red(error)}`);
    process.exit(1);
  }
};
