import { ethTimestampToDate } from "../env/time";
import { UserInfoWriteable } from "./init";

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
  UserInfoWriteable.update((u) => {
    return {
      ...u,
      endTime,
    };
  });
}

function _clockInListener(event) {
  const { timestamp } = event.returnValues;
  let startTime = ethTimestampToDate(timestamp);
  UserInfoWriteable.update((u) => {
    return {
      ...u,
      startTime,
    };
  });
}

export const clockInListener = wrapper(_clockInListener);
export const clockOutListener = wrapper(_clockInListener);
