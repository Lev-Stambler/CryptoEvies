import EvieCoinContract from "../../build/contracts/EvieCoin.json";
import { EvieCoin } from "../types";

import {
  clockInListener,
  clockOutListener,
  payoutListener,
} from "./event-listeners";
import { APIStore } from "./stores";

export async function initEvieCoin(web3) {
  const { EvieCoin, address } = await loadBlockchainData(web3);
  await setEventListeners(EvieCoin, address);
}

async function loadBlockchainData(web3) {
  const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
  const address = accounts[0];
  const networkId = await window.web3.eth.net.getId();
  const evieCoinData = EvieCoinContract.networks[networkId];
  if (evieCoinData) {
    const evieCoin: EvieCoin = (new web3.eth.Contract(
      EvieCoinContract.abi,
      evieCoinData.address
    ) as any) as EvieCoin;
    APIStore.set({
      EvieCoin: evieCoin,
      address,
    });
    return {
      EvieCoin: evieCoin,
      address,
    };
  } else {
    alert("Please use a web3.js enabled browser and make sure that EvieCoin is loaded")
    throw "Please use a web3.js enabled browser and make sure that EvieCoin is loaded"
  }
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
