<script lang="ts">
  // import Information from "./components/Information.svelte";
  import EvieCoinContract from "../build/contracts/EvieCoin.json";
  import loadWeb3 from "./utils/web3";
  import { onMount } from "svelte";

  let storageValue : any;
  let connected = false;
  let web3;
  let address
  let userInfo = {
    bal: -1
  }

  onMount(async () => {
    const instance = await loadWeb3();
    window["web3"] = web3 = instance;
    await loadBlockchainData();
  });

  async function loadBlockchainData() {
    const accounts = (await window.ethereum.send('eth_requestAccounts')).result;
    const networkId = await window.web3.eth.net.getId();
    const evieCoinData = (EvieCoinContract).networks[networkId];
    if (evieCoinData) {
      const evieCoin = new web3.eth.Contract(
        EvieCoinContract.abi,
        evieCoinData.address
      );
      address = accounts[0]
      userInfo.bal = await evieCoin.methods.balanceOf(address).call()
      connected = true
    } else {
      window.alert("Simple Storage contract not deployed to detected network.");
    }
  }
</script>

<style>
</style>

<div class="container">
  <div class="row">
    <div class="col-8">
      
    </div> 
  </div>
</div>