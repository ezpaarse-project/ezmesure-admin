// eslint-disable-next-line no-unused-vars
/* global describe, it, before */
const path = require('path');
const { expect } = require('chai');
const sushiCmd = require('../bin/cmds/sushi.js');

const sushiNatureTestFile = path.join(__dirname, '/sushi-nature-test.json');

describe('ezmesure-admin', () => {
//   it('should test access to springer-nature sushi api (@01)', async () => {
//     try {
//       await sushiCmd.sushi5(sushiNatureTestFile, {});
//     } catch (e) {
//       expect(e).to.have.property('statusCode', 400);
//       return null;
//     }

  it('should test access to springer-nature sushi api (@01)', async () => {
    const res = await sushiCmd.sushi5(sushiNatureTestFile, {});
    console.log(res);
    expect(res, 'Fatal problem').to.be.an('object').to.have.a.property('sushiRequests');
    expect(res.sushiRequests[0], 'Request problem').to.be.an('Object');
    expect(res.sushiRequests[0].reportHeader.Report_Name, 'Response problem').to.be.equal('Title Master Report');
  });
});
