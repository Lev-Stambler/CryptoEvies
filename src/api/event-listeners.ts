import { wrap } from "svelte-spa-router";
import { ethTimestampToDate } from "../env/time";
import { weiToCoinNumber } from "../utils/currency";
import { APIStore, StudentInfoStore } from "./stores";

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
  const { newPendingTok } = event.returnValues;
  if (newPendingTok) {
    alert('Congrats! You will get a new token if your supervisor approves this!')
    APIStore.update((u) => {
      return {
        ...u,
        reloadPage: true,
      };
    });
  }
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
  alert(`One of your tokens just got approved`);
  APIStore.update((u) => {
    return {
      ...u,
      reloadPage: true,
    };
  });
}

function _studentApprovalStatusChanged(event) {
  APIStore.update((u) => {
    return {
      ...u,
      reloadPage: true,
    };
  });
}

export const clockInListener = wrapper(_clockInListener);
export const clockOutListener = wrapper(_clockOutListener);
export const payoutListener = wrapper(_payoutListener);
export const studentApprovalStatusChanged = wrapper(
  _studentApprovalStatusChanged
);
