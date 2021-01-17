import { ethTimestampToDate } from "../env/time";
import { weiToCoinNumber } from "../utils/currency";
import { StudentInfoStore } from "./stores";

function wrapper(f: Function) {
  return (err, event) => {
    if (err) {
      console.error("Event Listener failed at function", f.name, "due to", err);
    } else {
      f(event);
    }
  };
}

function _clockOutListener(event) {
  const { timestamp } = event.returnValues;
  let endTime = ethTimestampToDate(timestamp);
  StudentInfoStore.update((u) => {
    return {
      ...u,
      endTime,
    };
  });
}

function _clockInListener(event) {
  const { timestamp } = event.returnValues;
  let startTime = ethTimestampToDate(timestamp);
  StudentInfoStore.update((u) => {
    return {
      ...u,
      startTime,
    };
  });
}

function _payoutListener(event) {
  const valWei = event.returnValues.value
  const value = weiToCoinNumber(valWei);
  StudentInfoStore.update((u) => {
    return {
      ...u,
      bal: u.bal + valWei,
    };
  });
  alert(`You just got paid out ${value}`);
}

export const clockInListener = wrapper(_clockInListener);
export const clockOutListener = wrapper(_clockOutListener);
export const payoutListener = wrapper(_payoutListener);
