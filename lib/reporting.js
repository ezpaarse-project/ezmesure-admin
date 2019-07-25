const config = require('config');
const instance = require('./app/api');

module.exports = {
  genereateReporting: (jobParams, space) => instance.post(`${config.kibanaUrl}${(space ? `/s/${space}` : '')}/api/reporting/generate/printablePdf?jobParams=${jobParams}`),

  downloadReporting: (id, space) => instance({
    methode: 'GET',
    url: `${config.kibanaUrl}${(space ? `/s/${space}` : '')}/api/reporting/jobs/download/${id}`,
    responseType: 'stream',
  }),

  getJobInfos: (id, space) => instance.get(`${config.kibanaUrl}${(space ? `/s/${space}` : '')}/api/reporting/jobs/info/${id}`),

  shortenUrl: url => instance.post(`${config.kibanaUrl}/api/shorten_url`, { url }),
};
