<script>
  import { weiToCoinNumber } from "../utils/currency";
  import { constants } from "../env/constants";
  import { APIStore, StudentInfoStore } from "../api/stores";
  import dateformat from "dateformat";
  import { onMount } from "svelte";
  import { loadBal, loadInitClockIn, loadInitClockOut } from "../api/student";

  let connected;
  onMount(async () => {
    const { EvieCoin, address } = $APIStore;
    console.log($APIStore)
    const proms = [
      loadInitClockIn(EvieCoin, address),
      loadInitClockOut(EvieCoin, address),
      loadBal(EvieCoin, address),
    ];
    await Promise.all(proms);
    connected = true;
  });

  async function clockIn() {
    await $APIStore.EvieCoin.methods
      .clockStartTime()
      .send({ from: $StudentInfoStore.address });
  }

  async function clockOut() {
    await $APIStore.EvieCoin.methods
      .clockEndTime()
      .send({ from: $StudentInfoStore.address });
  }
</script>

{#if connected}
  <div class="row">
    <div class="col-8">
      <p>Your current balance: {weiToCoinNumber($StudentInfoStore.bal || 0)}</p>
    </div>
  </div>
  <div class="row">
    <div class="col-4">
      <p>
        Start time: {$StudentInfoStore.startTime &&
        $StudentInfoStore.startTime.getTime() !== new Date(0).getTime()
          ? dateformat($StudentInfoStore.startTime, constants.dateFormatStr)
          : "Please clock in to see your start time"}
      </p>
    </div>
    <div class="col-4"><button on:click={clockIn}>Clock in</button></div>
    <div class="col-4"><button on:click={clockOut}>Clock out</button></div>
  </div>
{:else}
  Loading...
{/if}
