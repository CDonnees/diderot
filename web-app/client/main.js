TemplateController('Home', {
  helpers: {
    allTags() {
      return _.uniq(_.flatten(Searches.find({ wasModerated: true }).map(search => search.originalTags)));
    },
    selectedAnswers() {
      return Answers.find({});
    },
  },
});

