import EvieCoinContract from "../../build/contracts/EvieCoin.json";
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
  const networkId = await window.web3.eth.net.getId();
  let address;
  const evieCoinData = EvieCoinContract.networks[networkId];
  let evieCoin;
  if (evieCoinData) {
    evieCoin = new web3.eth.Contract(
      EvieCoinContract.abi,
      evieCoinData.address
    );
    APIStore.set({
      EvieCoin: evieCoin,
      address: accounts[0],
    });
  } else {
    window.alert("Evie Coin contract not deployed to detected network.");
    throw "Evie Coin contract not deployed to detected network.";
  }
  return {
    EvieCoin: evieCoin,
    address,
  };
}

async function setEventListeners(evieCoin, address) {
  evieCoin.events.ClockInTimeEvent({ user: address }, clockInListener);
  evieCoin.events.ClockOutTimeEvent({ user: address }, clockOutListener);
  evieCoin.events.PayoutMadeEvent({ _to: address }, payoutListener);
}
