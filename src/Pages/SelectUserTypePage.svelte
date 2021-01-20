<script>
  import { btnStyle } from "../style/components";
  import { push, pop, replace } from "svelte-spa-router";
  import { Button } from "svelte-mui";
</script>

<div class="container">
  <h2 style="grid-column: span 2;">Are you a student or supervisor?</h2>
  <Button raised on:click={() => push("/student")}>Student</Button>
  <Button raised on:click={() => push("/supervisor")}>Supervisor</Button>
</div>

<style>
  .container {
    display: grid;
    justify-content: center;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
</style>
