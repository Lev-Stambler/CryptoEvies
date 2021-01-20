<script lang="ts">
  import Router from "svelte-spa-router";
  import loadWeb3 from "./utils/web3";
  import { onMount } from "svelte";
  import { initEvieCoin } from "./api/init";
  import { APIStore, StudentInfoStore } from "./api/stores";
  import SelectUserTypePage from "./Pages/SelectUserTypePage.svelte";
  import SupervisorPage from "./Pages/Supervisor/SupervisorPage.svelte";
  import StudentPage from "./Pages/Student/StudentPage.svelte";

  let connected = false;
  let web3

  onMount(async () => {
    if (!connected) {
      const instance = await loadWeb3();
      await initEvieCoin(instance)
    }
    connected = true;
    APIStore.subscribe((store) => {
      if (store.reloadPage) {
        window.location.reload()
      }
    })
  });

  const routes = {
    "/": SelectUserTypePage,
    "/student": StudentPage,
    "/supervisor": SupervisorPage,
  };
</script>

<div class="container">
  {#if connected}
    <Router {routes} />
  {:else}
    Loading...
  {/if}
</div>

<style>
  .container {
    display: grid;
    align-items: center;
    justify-content: center;
    align-content: center;
    height: 100%;
  }
</style>
