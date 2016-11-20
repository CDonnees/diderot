

Meteor.startup(() => {
  if (Searches.find().count() === 0) {
    _.each(InitialData, ({ search, answer }) => {
      if (search && search.originalInput 
        && answer && !_.isEmpty(answer.title)) {
        console.log(answer);
        const answerId = Answers.insert(answer);

        const insertableSearch = _.extend({
          answersIds: [answerId],
          selectedAnswerId: answerId,
        }, search);
        Searches.insert(insertableSearch);
      }
    });
  }
});
