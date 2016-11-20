Meteor.methods({
  'sendNewSearchAndFetch'({ input }) {
    if (!this.isSimulation) {
      this.unblock();
      console.log(input);
      const searchId = Searches.createSearch({ input });
      Searches.newInputAndFetchAnswers({ searchId });
      return searchId;
    }
  },
});
