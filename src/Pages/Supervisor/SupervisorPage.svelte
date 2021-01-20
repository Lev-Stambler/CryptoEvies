<script>
  import { APIStore } from "../../api/stores";
  import { Button } from "svelte-mui";

  async function getPendingStudents() {
    const pending = await $APIStore.EvieCoin.methods
      .getSupsPotentialStudents()
      .call({ from: $APIStore.address });
    return { pendingAddrs: pending[0], pendingIdxs: pending[1] };
  }

  async function getCurrStudents() {
    const curr = await $APIStore.EvieCoin.methods
      .getSupsStudents()
      .call({ from: $APIStore.address });
    const pendingBalProms = curr[0].map((addr) =>
      $APIStore.EvieCoin.methods.getPendingCollectibles(addr).call()
    );
    return { addrs: curr[0], addrsIdx: curr[1], pendingBalProms };
  }

  async function loadData() {
    const pend = getPendingStudents();
    const curr = getCurrStudents();
    const ret = await Promise.all([pend, curr]);
    return {
      potStudents: ret[0],
      currStudents: ret[1],
    };
  }

  const prom = loadData();

  async function approveStudent(potStudIdx) {
    await $APIStore.EvieCoin.methods
      .potentialSupApproveStudent(potStudIdx)
      .send({ from: $APIStore.address });
  }

  async function approveToks(studAddr) {
    await $APIStore.EvieCoin.methods
      .SupervisorApproveAll(studAddr)
      .send({ from: $APIStore.address });
  }
</script>

{#await prom}
  Loading...
{:then info}
  <div>
    <h2>Potential Students</h2>
    {#if info.potStudents.pendingAddrs.length > 0}
      {#each info.potStudents.pendingAddrs as potStud, i}
        <div class="pot-student">
          <p>Pending student with address: {potStud}</p>
          <form
            on:submit={() => approveStudent(info.potStudents.pendingIdxs[i])}
          >
            <Button type="submit" name="">Approve Student</Button>
          </form>
        </div>
      {/each}
    {:else}
      <p>
        It looks like you have no pending students. To find out more, please
        visit our
        <a href="#"> Info page </a>
      </p>
    {/if}
  </div>
  <div>
    <h2>Current Students</h2>
    {#if info.currStudents.addrs.length > 0}
      {#each info.currStudents.addrs as currStud, i}
        <div class="curr-student">
          {#await info.currStudents.pendingBalProms[i]}
            Loading pending balance...
          {:then newPendingToks}
            {#if newPendingToks.length === 0}
              It looks like student with address {currStud} has no new pending balance
            {:else}
              <p>
                Current student with address: {currStud} has a pending balance of
                {newPendingToks.length}
                new tokens
              </p>
              <form action="">
                <Button type="submit" on:click={() => approveToks(currStud)}
                  >Approve pending balance</Button
                >
              </form>
            {/if}
          {/await}
        </div>
      {/each}
    {:else}
      <p>
        It looks like you have no current students. To find out more, please
        visit our
        <a href="#"> Info page </a>
      </p>
    {/if}
  </div>
{/await}

<style>
  .pot-student,
  .curr-student {
    border: 1px black solid;
    padding: 1rem;
  }
</style>
