<script>
  import Approved from "./Approved.svelte";
  import { APIStore } from "../../api/stores";
  import { onMount } from "svelte";
  import {
    loadBal,
    loadInitClockIn,
    loadInitClockOut,
    loadStudentType,
  } from "../../api/student";

  let connected;
  let studentType;
  onMount(async () => {
    const { EvieCoin, address } = $APIStore;
    console.log($APIStore);
    studentType = await loadStudentType(EvieCoin, address);
    console.log(studentType)
    // const proms = [
    //   loadInitClockIn(EvieCoin, address),
    //   loadInitClockOut(EvieCoin, address),
    //   loadBal(EvieCoin, address),
    // ];
    // await Promise.all(proms);
    connected = true;
  });
</script>

{#if connected}
  {#if studentType.FullStudent}
    <Approved />
  {:else if studentType.PendingStudent}
    PendingStudent
  {:else}
    None
  {/if}
{:else}
  Loading...
{/if}
