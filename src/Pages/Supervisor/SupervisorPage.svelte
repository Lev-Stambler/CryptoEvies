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

  async function approveStudent(potStudIdx) {
    await $APIStore.EvieCoin.methods
      .potentialSupApproveStudent(potStudIdx)
      .send({ from: $APIStore.address });
  }
  // TODO: add pot sup to events
</script>

{#await prom}
  Loading...
{:then potStudents}
  <div>
    <h2>Potential Students</h2>
    {#each potStudents.pendingAddrs as potStud, i}
      <div class="pot-student">
        <p>Pending student with address: {potStud}</p>
        <form on:submit={() => approveStudent(potStudents.pendingIdxs[i])}>
          <input type="submit" name="" value="Approve Student" />
        </form>
      </div>
    {/each}
  </div>
  <div>
    <h2>Current Students</h2>
  </div>
{/await}

<style>
  .pot-student {
    border: 1px black solid;
    padding: 1rem;
  }
</style>
