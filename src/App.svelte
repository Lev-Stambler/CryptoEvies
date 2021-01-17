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

  onMount(async () => {
    const instance = await loadWeb3();
    window["web3"] = web3 = instance;
    await initEvieCoin(web3);
    connected = true;
  });

  async function clockIn() {
    await $APIStore.EvieCoin.methods
      .clockStartTime()
      .send({ from: $UserInfoStore.address });
  }

  async function clockOut() {
    await $APIStore.EvieCoin.methods
      .clockEndTime()
      .send({ from: $UserInfoStore.address });
  }
</script>

<div class="container">
  {#if connected}
    <div class="row">
      <div class="col-8">
        <p>Your current balance: {$UserInfoStore.bal}</p>
      </div>
    </div>
    <div class="row">
      <div class="col-4">
        <p>
          {$UserInfoStore.endTime
            ? `Your clock out time: ${dateformat(
                $UserInfoStore.endTime,
                constants.dateFormatStr
              )}`
            : "Looks like you have no last end time"}
        </p>
        <p>
          Start time: {$UserInfoStore.startTime &&
          $UserInfoStore.startTime.getTime() !== new Date(0).getTime()
            ? dateformat($UserInfoStore.startTime, constants.dateFormatStr)
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
