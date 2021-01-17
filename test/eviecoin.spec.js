"use strict";

const EvieCoin = artifacts.require("./EvieCoin.sol");
// const time = require("./utils/time");
const { time } = require("@openzeppelin/test-helpers");

contract("EvieCoin", function (accounts) {
  let [aliceOwner, teacherGeorgina, goodStudentBob, badStudentJimbo] = accounts;
  let instance
  beforeEach(async () => {
    instance = await EvieCoin.deployed();
  });

  context("A student clocking in and out expectedly", async () => {
    it("Should have a successful objective made", async () => {

      // Check initial balance
      let result = await instance.balanceOf(goodStudentBob, { from: goodStudentBob });
      assert.equal(result.toString(), web3.utils.toWei("0"));

      // Clock in
      result = await instance.clockStartTime({ from: goodStudentBob });
      assert.equal(result.receipt.status, true);

      // 45 minutes go by
      await time.increase(time.duration.minutes(45));

      // Clock out
      result = await instance.clockEndTime({ from: goodStudentBob });
      assert.equal(result.receipt.status, true);

      result = await instance.balanceOf(goodStudentBob, { from: goodStudentBob });
      assert.equal(result.toString(), web3.utils.toWei("1"));
    });

    it("Should have failed the objective objective made", async () => {
      
      // Check initial balance
      let result = await instance.balanceOf(badStudentJimbo, { from: badStudentJimbo });
      assert.equal(result.toString(), web3.utils.toWei("0"));

      // Clock in
      result = await instance.clockStartTime({ from: badStudentJimbo });
      assert.equal(result.receipt.status, true);

      // 75 minutes go by
      await time.increase(time.duration.minutes(175));

      // Clock out
      result = await instance.clockEndTime({ from: badStudentJimbo });
      assert.equal(result.receipt.status, true);

      result = await instance.balanceOf(badStudentJimbo, { from: badStudentJimbo });
      assert.equal(result.toString(), web3.utils.toWei("0"));
    });
  });

  context("Check edge cases/ faulty sends", async () => {
    xit("Only one clock out can be made per day", async () => {

    });
  });
});
