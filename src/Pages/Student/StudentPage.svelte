<script>
  import Approved from "./Approved.svelte";
  import PendingStudent from './PendingStudent.svelte'
  import { APIStore } from "../../api/stores";
  import { onMount } from "svelte";
  import {
    loadStudentType,
  } from "../../api/student";
  import { StudentStatus } from "../../api/interfaces";

  let connected;
  let studentType;
  onMount(async () => {
    const { EvieCoin, address } = $APIStore;
    studentType = await loadStudentType(EvieCoin, address);
    connected = true;
  });
</script>

{#if connected}
  {#if studentType === StudentStatus.FullStudent}
    <Approved />
  {:else}
    <PendingStudent
      studentAlreadyPending={studentType === StudentStatus.PendingStudent}
    />
  {/if}
{:else}
  Loading...
{/if}
