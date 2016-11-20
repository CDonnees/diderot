TemplateController('Home', {
  state: {
    newSearchId: null,
    searchLoading: false,
  },
  helpers: {
    allTags() {
      return _.uniq(_.flatten(Searches.find({ wasModerated: true, selectedAnswerId: { $ne: null } }).map(search => search.originalTags)));
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
    newSearch(id) {
      return Searches.findOne(id);
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
    'click #js-send-search'(e) {
      const $input = $(e.target).closest('#tag-search');
      const val = $input.val();
    },
  },
});

