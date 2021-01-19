<script>
  import Approved from "./Approved.svelte";
  import { APIStore } from "../../api/stores";
  import { onMount } from "svelte";
  import {
    loadBal,
    loadInitClockIn,
    loadInitClockOut,
  } from "../../api/student";

  let connected;
  onMount(async () => {
    const { EvieCoin, address } = $APIStore;
    console.log($APIStore);
    const proms = [
      loadInitClockIn(EvieCoin, address),
      loadInitClockOut(EvieCoin, address),
      loadBal(EvieCoin, address),
    ];
    await Promise.all(proms);
    connected = true;
  });
</script>

{#if connected}
  <Approved />
{:else}
  Loading...
{/if}
