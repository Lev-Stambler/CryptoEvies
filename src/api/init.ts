import { writable } from "svelte/store";
import EvieCoinContract from "../../build/contracts/EvieCoin.json";
import { ethTimestampToDate } from "../env/time";
import { clockInListener, clockOutListener } from "./event-listeners";
import type { IAPIStore, IUserInfo } from "./interfaces";

export const APIWriteable = writable({
  EvieCoin: undefined,
  address: "",
} as IAPIStore);
export const UserInfoWriteable = writable({} as Partial<IUserInfo>);

export const APIStore = {
  subscribe: APIWriteable.subscribe,
};

export const UserInfoStore = {
  subscribe: UserInfoWriteable.subscribe,
};

export async function initEvieCoin(web3) {
  await loadBlockchainData(web3);
}

APIWriteable.subscribe(async (api) => {
  if (api.EvieCoin) {
    await setEventListeners(api.EvieCoin, api.address);
    const proms = [
      loadInitClockIn(api.EvieCoin, api.address),
      loadInitClockOut(api.EvieCoin, api.address),
    ];
    await Promise.all(proms);
  }
});

async function loadBlockchainData(web3) {
  const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
  const networkId = await window.web3.eth.net.getId();
  const evieCoinData = EvieCoinContract.networks[networkId];
  let evieCoin;
  if (evieCoinData) {
    evieCoin = new web3.eth.Contract(
      EvieCoinContract.abi,
      evieCoinData.address
    );
    APIWriteable.set({
      EvieCoin: evieCoin,
      address: accounts[0],
    });
    const bal = await evieCoin.methods.balanceOf(accounts[0]).call();
    UserInfoWriteable.update((u) => {
      return {
        ...u,
        address: accounts[0],
        bal,
      };
    });
  } else {
    window.alert("Evie Coin contract not deployed to detected network.");
    throw "Evie Coin contract not deployed to detected network.";
  }
}

async function loadInitClockIn(evieCoin, address) {
  let startTime: Date;
  try {
    const pastevents = await evieCoin.getPastEvents("ClockInTimeEvent", {
      user: address,
    });
    const mostRecent = pastevents[pastevents.length - 1];
    // Date is returned in seconds, needs to be changed to millis
    startTime = ethTimestampToDate(mostRecent.returnValues.timestamp);
    UserInfoWriteable.update((u) => {
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

async function loadInitClockOut(evieCoin, address) {
  let endTime: Date;
  try {
    const pastevents = await evieCoin.getPastEvents("ClockOutTimeEvent", {
      user: address,
    });
    const mostRecent = pastevents[pastevents.length - 1];
    // Date is returned in seconds, needs to be changed to millis
    endTime = ethTimestampToDate(mostRecent.returnValues.timestamp);
    UserInfoWriteable.update((u) => {
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

async function setEventListeners(evieCoin, address) {
  evieCoin.events.ClockInTimeEvent({ user: address }, clockInListener);
  evieCoin.events.ClockOutTimeEvent({ user: address }, clockOutListener);
}
