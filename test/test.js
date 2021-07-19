// eslint-disable-next-line no-unused-vars
/* global describe, it, before */
const path = require('path');
const { expect } = require('chai');
const sushiCmd = require('../bin/cmds/sushi');

const sushiNatureTestFile1 = path.join(__dirname, '/sushi-nature-test.json');
const sushiNatureTestFile2 = path.join(__dirname, '/sushi-nature-test-multi.json');

describe('ezmesure-admin', () => {
//   it('should test access to springer-nature sushi api (@01)', async () => {
//     try {
//       await sushiCmd.sushi5(sushiNatureTestFile, {});
//     } catch (e) {
//       expect(e).to.have.property('statusCode', 400);
//       return null;
//     }

  it('should test access to springer-nature sushi api (@01)', async () => {
    const res = await sushiCmd.sushi5(sushiNatureTestFile1, {});
    console.log(res);
    expect(res, 'Fatal problem').to.be.an('object').to.have.a.property('sushiRequests');
    expect(res.sushiRequests[0], 'Request problem').to.be.an('Object');
    expect(res.sushiRequests[0].reportHeader.Report_Name, 'Response problem').to.be.equal('Title Master Report');
  });
  it('should test access 2 times to springer-nature sushi api (@01)', async () => {
    const res = await sushiCmd.sushi5(sushiNatureTestFile2, {});
    console.log(res);
    expect(res, 'Fatal problem').to.be.an('object').to.have.a.property('sushiRequests');
    expect(res.sushiRequests[0], 'Request problem').to.be.an('Object');
    expect(res.sushiRequests[0].reportHeader.Report_Name, 'Response problem').to.be.equal('Title Master Report');
  });
});
