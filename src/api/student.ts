import { ethTimestampToDate } from "../env/time";
import type { EvieCoin } from "../types";
import type { StudentStatus } from "./interfaces";
import { StudentInfoStore } from "./stores";

export async function loadStudentType(
  evieCoin: EvieCoin,
  address
): Promise<StudentStatus> {
  const status = await evieCoin.methods.studentStatus(address).call();
  return parseInt(status) as StudentStatus;
}

export async function loadInitClockIn(evieCoin, address) {
  try {
    const startTimeEth = await evieCoin.methods.clock_in_times(address).call();
    const startTime = ethTimestampToDate(startTimeEth);
    StudentInfoStore.update((u) => {
      return {
        ...u,
        startTime,
      };
    });
  } catch (error) {
    console.error(error);
    throw "Error getting initial clock in time";
  }
}

export async function loadBal(evieCoin: EvieCoin, address) {
  const bal = await evieCoin.methods.balanceOf(address).call();
  const pendingToks = await evieCoin.methods.getPendingCollectibles(address).call()
  StudentInfoStore.update((u) => {
    return {
      ...u,
      address,
      pendingToks: pendingToks.length,
      approvedToks: bal,
    };
  });
}

