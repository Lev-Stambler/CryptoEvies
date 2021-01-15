'use strict'

const EvieCoin = artifacts.require("./EvieCoin.sol")

contract('EvieCoin', function(accounts) {
  let instance

  before(async () => {
    instance = await EvieCoin.deployed()
  })

  it('TODO Test me', async () => {
    await instance.setStore(89, {
      from: accounts[0]
    })

    const data = await instance.get.call()
    assert.equal(data, 89, "The value 89 was not stored.")
  })
})
