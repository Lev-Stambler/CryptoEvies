import { ethTimestampToDate } from "../env/time";
import { StudentInfoStore } from "./stores";

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

export async function loadBal(evieCoin, address) {
  const bal = await evieCoin.methods.balanceOf(address).call();
  StudentInfoStore.update((u) => {
    return {
      ...u,
      address,
      bal,
    };
  });
}

export async function loadInitClockOut(evieCoin, address) {
  let endTime: Date;
  try {
    const pastevents = await evieCoin.getPastEvents("ClockOutTimeEvent", {
      user: address,
    });
    if (pastevents.length === 0) return;
    const mostRecent = pastevents[pastevents.length - 1];
    // Date is returned in seconds, needs to be changed to millis
    endTime = ethTimestampToDate(mostRecent.returnValues.timestamp);
    StudentInfoStore.update((u) => {
      return {
        ...u,
        endTime,
      };
    });
  } catch (error) {
    console.error(error);
    throw "Error getting initial clock in time";
  }
}
