Meteor.methods({
  'sendNewSearch'({ input }) {
    if (!this.isSimulation) {
      this.unblock();
      const searchId = Searches.createSearch({ input });
      Searches.newInputAndFetchAnswers({ searchId });
      return searchId;
    }
  },
});
