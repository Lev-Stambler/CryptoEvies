<script>
  import { APIStore, StudentInfoStore } from "../../api/stores";
  import { Button, Textfield } from "svelte-mui";
  export let studentAlreadyPending = false;
  let supervisor;

  async function createPotStudent() {
    console.log("a");
    await $APIStore.EvieCoin.methods
      .createPotentialStudent(supervisor)
      .send({ from: $APIStore.address });
    // TODO: add pending shtuff to events and student info
  }
</script>

<div>
  {#if studentAlreadyPending}
    <h2>Your requested supervisor is reviewing your request</h2>
    <form action="">
      <Button type="submit" disabled raised>Change requested supervisor</Button>
    </form>
  {:else}
    <h2>Request a supervisor</h2>
    <form action="" on:submit={() => createPotStudent()}>
      <Textfield
        type="text"
        bind:value={supervisor}
        label="Supervisor Address"
        required
      />
      <Button type="submit" value="submit" raised>Submit</Button>
    </form>
  {/if}
</div>
