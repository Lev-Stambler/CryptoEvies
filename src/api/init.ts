import EvieCoinContract from "../../build/contracts/EvieCoin.json";
import { EvieCoin } from "../types";

import {
  clockInListener,
  clockOutListener,
  payoutListener,
} from "./event-listeners";
import { APIStore } from "./stores";

export async function initEvieCoin() {
  const { EvieCoin, address } = await loadBlockchainData();
  await setEventListeners(EvieCoin, address);
}

async function loadBlockchainData() {
  const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
  const address = accounts[0];

  const evieCoin: EvieCoin = (new window.web3.eth.Contract(
    EvieCoinContract.abi,
    address
  ) as any) as EvieCoin;

  APIStore.set({
    EvieCoin: evieCoin,
    address,
  });
  return {
    EvieCoin: evieCoin,
    address,
  };
}

async function setEventListeners(evieCoin: EvieCoin, address) {
  evieCoin.events.ClockInTimeEvent(
    { filter: { user: address } },
    clockInListener
  );
  evieCoin.events.ClockOutTimeEvent(
    { filter: { user: address } },
    clockOutListener
  );
  evieCoin.events.PayoutMadeEvent({ filter: { _to: address } }, payoutListener);
}
