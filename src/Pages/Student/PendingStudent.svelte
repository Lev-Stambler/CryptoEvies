<script>
  import { APIStore, StudentInfoStore } from "../../api/stores";
  export let studentAlreadyPending = false;
  let supervisor;

  async function createPotStudent() {
    console.log("a")
    await $APIStore.EvieCoin.methods
      .createPotentialStudent(supervisor)
      .send({ from: $APIStore.address });
    // will change the type of student
    // window.location.reload()
  }
</script>

<div>
  {#if studentAlreadyPending}
    <h2>Your supervisor is reviewing your request</h2>
    <form action="">
      <input type="submit" disabled value="Change requested supervisor" />
    </form>
  {:else}
    <h2>Request a supervisor</h2>
    <form action="" on:submit={() => createPotStudent()}>
      <input
        type="text"
        bind:value={supervisor}
        placeholder="Supervisor Address"
        required
      />
      <input type="submit" value="submit" />
    </form>
  {/if}
</div>
