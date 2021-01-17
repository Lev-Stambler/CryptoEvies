import { ethTimestampToDate } from "../env/time";
import { weiToCoinNumber } from "../utils/currency";
import { UserInfoStore } from "./init";

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
  console.log(endTime)
  UserInfoStore.update((u) => {
    return {
      ...u,
      endTime,
    };
  });
}

function _clockInListener(event) {
  const { timestamp } = event.returnValues;
  let startTime = ethTimestampToDate(timestamp);
  console.log(startTime)
  UserInfoStore.update((u) => {
    return {
      ...u,
      startTime,
    };
  });
}

function _payoutListener(event) {
  const {value} = weiToCoinNumber(event.returnValues)
  alert(`You just got paid out ${value}`)
}

export const clockInListener = wrapper(_clockInListener);
export const clockOutListener = wrapper(_clockOutListener);
export const payoutListener = wrapper(_payoutListener)
