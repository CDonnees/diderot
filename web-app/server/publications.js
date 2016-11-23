Meteor.publish('lastSearchesAndTheirAnswers', () => {
  const lastSearches = Searches.find({
    wasModerated: true, selectedAnswerId: { $ne: null },
  }, {
    sort: {
      createdAt: -1,
    },
    limit: 20,
  });
  const answersIds = lastSearches.map(search => search.selectedAnswerId);
  const theirAnswers = Answers.find({
    _id: {
      $in: answersIds,
    },
  });
  return [lastSearches, theirAnswers];
});

Meteor.publish('myCurrentSearchAndItsAnswers', (newSearchId) => {
  if (newSearchId) {
    const search = Searches.find({ _id: newSearchId });
    const foundSearch = search.fetch()[0];
    if (foundSearch) {
      const answers = Answers.find({
        _id: {
          $in: foundSearch.answersIds,
        },
      });

      return [search, answers];
    }
    return search;
  }
});
