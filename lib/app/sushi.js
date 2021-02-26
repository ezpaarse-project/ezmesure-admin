const axios = require('axios');
const { config } = require('./config');

const instance = axios.create({
  timeout: config.timeout || 3000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ezmesure-admin',
  },
  proxy: config.proxy || false,
});

instance.interceptors.request.use((opts) => {
  const conf = opts || {};
  conf.headers['request-startTime'] = process.hrtime();
  return conf;
}, (error) => Promise.reject(error));

instance.interceptors.response.use((response) => {
  const start = response.config.headers['request-startTime'];
  const end = process.hrtime(start);
  response.headers['request-duration'] = Math.round((end[0] * 1000) + (end[1] / 1000000));
  return response;
}, (error) => {
  const start = error.response.config.headers['request-startTime'];
  const end = process.hrtime(start);
  error.response.headers['request-duration'] = Math.round((end[0] * 1000) + (end[1] / 1000000));
  return Promise.reject(error);
});

module.exports = instance;
