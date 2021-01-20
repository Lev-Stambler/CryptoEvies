<script>
  import { weiToCoinNumber } from "../../utils/currency";
  import { constants } from "../../env/constants";
  import { APIStore, StudentInfoStore } from "../../api/stores";
  import { Button } from "svelte-mui";
  import dateformat from "dateformat";
  import { onMount } from "svelte";
  import { loadBal, loadInitClockIn } from "../../api/student";

  onMount(async () => {
    const proms = [
      loadBal($APIStore.EvieCoin, $APIStore.address),
      loadInitClockIn($APIStore.EvieCoin, $APIStore.address),
    ];
    await Promise.all(proms)
  });
  async function clockIn() {
    await $APIStore.EvieCoin.methods
      .clockStartTime()
      .send({ from: $APIStore.address });
  }

  async function clockOut() {
    await $APIStore.EvieCoin.methods
      .clockEndTime()
      .send({ from: $APIStore.address });
  }
</script>

<div class="container">
  <div class="balances" style="grid-column: 1 / span 2;">
    <h2>Your balances</h2>
    <p>
      Your currently have {$StudentInfoStore.pendingToks || 0}
      pending tokens
    </p>
    <p>
      Your currently have {$StudentInfoStore.approvedToks || 0}
      approved tokens
    </p>
  </div>
  <p style="grid-column: 1 / span 2;" />
  <div style="grid-column: 1 / span 2;">
    <p>
      Start time: {$StudentInfoStore.startTime &&
      $StudentInfoStore.startTime.getTime() !== new Date(0).getTime()
        ? dateformat($StudentInfoStore.startTime, constants.dateFormatStr)
        : "Please clock in to see your start time"}
    </p>
  </div>
  <Button raised on:click={clockIn}>Clock in</Button>
  <Button raised on:click={clockOut}>Clock out</Button>
</div>

<style>
  .balances {
    background-color: rgb(221, 221, 221);
    padding: 2rem;
    border-radius: 2rem;
  }
  .container {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr 1fr;
  }
  .container * {
    text-align: center;
  }
</style>
