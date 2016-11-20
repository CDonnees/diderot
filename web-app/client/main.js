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
      }, {
        sort: {
          createdAt: -1,
        },
      }).map(search => search.goodAnswer());
    },
    isSelectedTag(tag) {
      const selectedValues = FlowRouter.getQueryParam('selectedValues') || [];
      const index = selectedValues.indexOf(tag);
      return index !== -1;
    },
    newSearch() {
      return Searches.findOne(this.state.newSearchId);
    },
    getGoodTwitterImage(answerId) {
      Meteor.defer(() => {
        console.log(answerId);
        const selector = `.result-card[data-index="${answerId}"]`;
        console.log(selector);

        const heightPx = this.$(selector).css('height');

        const goodHeight = 2 * parseInt(heightPx.substr(0, heightPx.length - 2));

        function callItAgainSam() {
          Meteor.call('getGoodTwitterImage', { answerId, height: goodHeight }, (err, res) => {
            if (err) {
              console.log(err);
            } else {
              if (res.status === "processing") {
                Meteor.setTimeout(callItAgainSam, 3000);
              }
            }
          });
        }

        callItAgainSam();
      });
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
      const $input = this.$('#tag-search');
      const val = $input.val();
      this.state.searchLoading = true;

      console.log(val);
      Meteor.call('sendNewSearchAndFetch', { input: val }, (err, res) => {
        this.state.searchLoading = false;
        if (err) {
          console.log(err);
        } else {
          this.state.newSearchId = res;
        }
      });
    },
    'click .js-validate-answer'(e) {
      const $answer = this.$(e.target).closest('.js-validate-answer');
      const answerId = $answer.data('index');
      Meteor.call('validateNewSearchAnswer', { searchId: this.state.newSearchId, answerId });
      const search = Searches.findOne(this.state.newSearchId);
      const selectedValues = FlowRouter.getQueryParam('selectedValues') || [];
      _.each(search.originalTags, tag => selectedValues.push(tag));

      FlowRouter.setQueryParams({ selectedValues });
      this.state.newSearchId = false;
    },
  },
});

