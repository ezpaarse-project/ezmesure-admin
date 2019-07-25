const { smtp } = require('config');
const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(smtp);

module.exports = {
  sendMail: async (mailOptions, report) => {
    mailOptions = mailOptions || {};
    mailOptions.attachments = mailOptions.attachments || [];

    mailOptions.attachments.push({
      filename: report,
      path: path.resolve('./reports', report),
      cid: report,
    });

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) { return reject(err); }
        return resolve(info);
      });
    });
  },
};
