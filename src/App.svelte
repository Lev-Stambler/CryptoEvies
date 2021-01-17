<script lang="ts">
  import dateformat from "dateformat";
  import loadWeb3 from "./utils/web3";
  import { onMount } from "svelte";
  import { constants } from "./env/constants";
  import { APIStore, initEvieCoin, UserInfoStore } from "./api/init";
  import type { IAPIStore, IUserInfo } from "./api/interfaces";

  let storageValue: any;
  let connected = false;
  let web3;
  let api: IAPIStore
  let userInfo: Partial<IUserInfo> 

  onMount(async () => {
    const instance = await loadWeb3();
    window["web3"] = web3 = instance;
    await initEvieCoin(web3);
    api = $APIStore
    userInfo = $UserInfoStore
    connected = true;
    console.log(api)
  });

  async function clockIn() {
    await api.EvieCoin.methods.clockStartTime().send({ from: userInfo.address });
  }

  async function clockOut() {
    await api.EvieCoin.methods.clockEndTime().send({ from: userInfo.address });
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
        <p>
          Start time: {userInfo.startTime
            ? dateformat(userInfo.startTime, constants.dateFormatStr)
            : "Please clock in to see your start time"}
        </p>
      </div>
      <div class="col-4"><button on:click={clockIn}>Clock in</button></div>
      <div class="col-4"><button on:click={clockOut}>Clock out</button></div>
    </div>
  {:else}
    Loading...
  {/if}
</div>

<style>
</style>
