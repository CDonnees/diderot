Meteor.methods({
  'sendNewSearchAndFetch'({ input }) {
    if (!this.isSimulation) {
      this.unblock();

      const searchId = Searches.createSearch({ input });
      Searches.newInputAndFetchAnswers({ searchId });
      return searchId;
    }
  },
  validateNewSearchAnswer({ searchId, answerId }) {
    Searches.validateAnswer({ searchId, answerId });
    Searches.validateForModeration({ searchId });
  },
  getGoodTwitterImage({ answerId, height, base64 }) {
    if (!this.isSimulation) {
      this.unblock();
      return Answers.getGoodTwitterImage({ answerId, height, base64 });
    }
  },
});
