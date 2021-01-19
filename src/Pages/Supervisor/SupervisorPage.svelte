<script>
  import { APIStore } from "../../api/stores";

  async function getPendingStudents() {
    console.log($APIStore.address);
    const pending = await $APIStore.EvieCoin.methods
      .getSupsPotentialStudents()
      .call({ from: $APIStore.address });
    return { pendingAddrs: pending[0], pendingIdxs: pending[1] };
  }
  const prom = getPendingStudents();
</script>

<style>
  .pot-student {
    border: 1px black solid;
    padding: 1rem;
  }
</style>
{#await prom}
  Loading...
{:then potStudents}
  {#each potStudents.pendingAddrs as potStud}
    <div class="pot-student">
      <p>Pending student with address: {potStud}</p>
    <form action="">
      <input type="submit" name="" value="Approve Student" />
    </form>
    </div>
  {/each}
{/await}
