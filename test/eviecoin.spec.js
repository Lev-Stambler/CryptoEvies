"use strict";

const EvieCoin = artifacts.require("./EvieCoin.sol");
// const time = require("./utils/time");
const { time } = require("@openzeppelin/test-helpers");

contract("EvieCoin", function (accounts) {
  let [
    aliceOwner,
    supervisorGeorge,
    goodStudentBob,
    badStudentJimbo,
  ] = accounts;
  let instance;
  before(async () => {
    instance = await EvieCoin.deployed();

    async function createStudent(studentAddr, supAddr = supervisorGeorge) {
      let [potStudents, inds] = Object.entries(
        await instance.getSupsPotentialStudents({
          from: supAddr,
        })
      );
      const priorPotentialNumbStudents = potStudents.length;

      let result = await instance.getSupsStudents({ from: supAddr });

      const priorNumbStudents = result.length;

      result = await instance.createPotentialStudent(supAddr, {
        from: studentAddr,
      });
      assert.equal(result.receipt.status, true);

      result = await instance.getSupsPotentialStudents({
        from: supAddr,
      });
      console.log(result)
      potStudents = result[0];
      inds = result[1];
      assert.equal(
        potStudents.length,
        priorPotentialNumbStudents + 1,
        "Adding a potential student should have increased the sup's pending students by 1"
      );

      result = await instance.potentialSupApproveStudent(
        inds[inds.length - 1],
        {
          from: supAddr,
        }
      );
      assert.equal(result.receipt.status, true);
      result = await instance.getSupsStudents({ from: supAddr });
      assert.equal(result.length, priorNumbStudents + 1);
      assert.equal(
        studentAddr.toString(),
        result[priorNumbStudents].student.toString()
      );
    }
    await createStudent(goodStudentBob);
    await createStudent(badStudentJimbo);
  });

  context("A student clocking in and out expectedly", async () => {
    // TODO: have a fn for clock in clock out with time as param. Make this fn call that
    async function successfulStudent(studentAddr) {
      // Check initial balance
      let result = await instance.balanceOf(goodStudentBob, {
        from: goodStudentBob,
      });
      const initBal = result;

      const initPendingNumb = await instance.getPendingCollectibles(
        goodStudentBob
      );

      // Clock in
      result = await instance.clockStartTime({ from: goodStudentBob });
      assert.equal(result.receipt.status, true);

      // 45 minutes go by
      await time.increase(time.duration.minutes(45));

      // Clock out
      result = await instance.clockEndTime({ from: goodStudentBob });
      assert.equal(result.receipt.status, true);

      // ensure that the balance does not change
      result = await instance.balanceOf(goodStudentBob, {
        from: goodStudentBob,
      });
      assert.equal(result.toString(), initBal.toString());
      return { initBal, initPendingNumb };
    }

    it("Should have a successful objective made, with the supervisor approving the pending transaction", async () => {
      const { initBal, initPendingNumb } = await successfulStudent(
        goodStudentBob
      );
      assert.equal(initPendingNumb, 0);
      let result = await instance.getPendingCollectibles(goodStudentBob);
      assert.equal(result.length, initPendingNumb + 1);
    });

    xit("Should have a successful objective made, with the supervisor disapproving the pending transaction", async () => {});

    it("Should have failed the objective objective made", async () => {
      // Check initial balance
      let result = await instance.balanceOf(badStudentJimbo, {
        from: badStudentJimbo,
      });
      assert.equal(result.toString(), web3.utils.toWei("0"));

      // Clock in
      result = await instance.clockStartTime({ from: badStudentJimbo });
      assert.equal(result.receipt.status, true);

      // 75 minutes go by
      await time.increase(time.duration.minutes(175));

      // Clock out
      result = await instance.clockEndTime({ from: badStudentJimbo });
      assert.equal(result.receipt.status, true);

      result = await instance.balanceOf(badStudentJimbo, {
        from: badStudentJimbo,
      });
      assert.equal(result.toString(), web3.utils.toWei("0"));

      // ensure that no rewards are pending
      result = await instance.getPendingCollectibles(badStudentJimbo);
      assert.equal(result.length, 0);
    });
  });

  context("Check edge cases/ faulty sends", async () => {
    xit("Only one clock out can be made per day", async () => {});
  });

  xcontext(
    "Check edge cases/ faulty case for student sup interaction",
    async () => {}
  );
});
