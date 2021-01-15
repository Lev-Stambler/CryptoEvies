<script lang="ts">
  // import Information from "./components/Information.svelte";
  import EvieCoinContract from "../build/contracts/EvieCoin.json";
  import loadWeb3 from "./utils/web3";
  import { onMount } from "svelte";

  let storageValue: any;
  let connected = false;
  let web3;
  let address;
  let evieCoin;
  let userInfo = {
    startTime: 0,
    bal: -1,
  };

  onMount(async () => {
    const instance = await loadWeb3();
    window["web3"] = web3 = instance;
    await loadBlockchainData();
  });

  async function loadBlockchainData() {
    const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
    const networkId = await window.web3.eth.net.getId();
    const evieCoinData = EvieCoinContract.networks[networkId];
    if (evieCoinData) {
      evieCoin = new web3.eth.Contract(
        EvieCoinContract.abi,
        evieCoinData.address
      );
      address = accounts[0];
      console.log(address);
      userInfo.bal = await evieCoin.methods.balanceOf(address).call();
      connected = true;
    } else {
      window.alert("Evie Coin contract not deployed to detected network.");
    }
  }

  async function clockIn() {
    await evieCoin.methods.clockStartTime().send({ from: address });
    userInfo.startTime = 
  }

  async function clockOut() {
    await evieCoin.methods.clockEndTime().send({ from: address });
  }
</script>

<div class="container">
  {#if connected}
    <div class="row">
      <div class="col-8">
        <p>Your current balance: {userInfo.bal}</p>
      </div>
    </div>
    <div class="row">
      <div class="col-4">
        <p>Start time: { userInfo.startTime ? userInfo.startTime : "Please clock in to see your start time" }</p></div>
      <div class="col-4"><button on:click={clockIn}>Clock in</button></div>
      <div class="col-4"><button on:click={clockOut}>Clock out</button></div>
    </div>
  {:else}
    Loading...
  {/if}
</div>

<style>
</style>
