

Meteor.startup(() => {
  if (Searches.find().count() === 0) {
    _.each(InitialData, ({ search, answer }) => {
      if (answer && !_.isEmpty(answer.title)) {
        // const answerId = Answers.insert(answer);

        // const insertableSearch = _.extend({
        //   answersIds: [answerId],
        //   selectedAnswerId: answerId,
        // });
        // Searches.insert(insertableSearch);
      }
    });
  }
});
