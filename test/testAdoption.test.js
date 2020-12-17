const Adoption = artifacts.require("Adoption");

contract("Adoption", (accounts) => {
  let adoption;

  before(async () => {
    adoption = await Adoption.deployed();
  });

  describe("adopting a pet and retrieving account addresses", async () => {
    before("adopt a pet using accounts[0]", async () => {
      await adoption.adopt(8, { from: accounts[0] });
      expectedAdopter = accounts[0];
    });

    it("can fetch the address of an owner by pet id", async () => {
      const adopter = await adoption.adopters(8);
      assert.equal(adopter, expectedAdopter, "The owner of the adopted pet should be the first account.");
    });
  });
});
