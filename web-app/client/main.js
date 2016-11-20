TemplateController('Home', {
  helpers: {
    allTags() {
      return _.uniq(_.flatten(Searches.find({ wasModerated: true }).map(search => search.originalTags)));
    },
    selectedAnswers() {
      return Searches.find({
        originalTags: {
          $in: FlowRouter.getQueryParam('selectedValues') || [],
        },
      }).map(search => search.goodAnswer());
    },
    isSelectedTag(tag) {
      const selectedValues = FlowRouter.getQueryParam('selectedValues') || [];
      const index = selectedValues.indexOf(tag);
      return index !== -1;
    },
  },
  events: {
    'click .tag'(e) {
      const $tag = $(e.target).closest('.tag');
      const val = $tag.text();
      const selectedValues = FlowRouter.getQueryParam('selectedValues') || [];
      const index = selectedValues.indexOf(val);
      if (index !== -1) {
        selectedValues.splice(index, 1);
      } else {
        selectedValues.push(val);
      }
      FlowRouter.setQueryParams({ selectedValues });
    },
  },
});

