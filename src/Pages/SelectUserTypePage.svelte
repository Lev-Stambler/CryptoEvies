<script>
  import { push, pop, replace } from "svelte-spa-router";
</script>

<div class="modal">
  <h2>Are you a student or supervisor?</h2>
  <button on:click={() => push("/student")}> Student</button><button
    on:click={() => push("/supervisor")}>Supervisor</button
  >
</div>
