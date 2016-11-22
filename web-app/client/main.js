import $ from 'jquery';
import masonry from 'masonry-layout';

toDataUrl = function(text, title, callback, outputFormat, height) {
  // const canvas = document.createElement('CANVAS');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let dataURL;
  canvas.height = height;
  // canvas.width = this.width;
  // const htmlContainer = document.getElementById(elementId);
  // const html = htmlContainer.innerHTML;
  const html = `<link rel='stylesheet' type='text-css' href='https://fonts.googleapis.com/css?family=Abril+Fatface'><style>@font-face {font-family: 'Abril Fatface'; src: url('abril-fatface/AbrilFatface-Regular.otf') format('opentype'); font-style: normal;}</style><div style="width:800px;text-align:center;font-size:2rem; font-family: 'Abril Fatface', cursive;"><div style="font-family: 'Abril Fatface';padding: 0.5rem;background-color: white;letter-spacing: 0.4rem;text-transform: uppercase;font-size: 1.6rem;color:#333;"># Que Dirait Diderot ?</div><div style="font-family: 'Abril Fatface';padding: 3rem;color:#333;background-color: #84f7fd;">"${text}"</div><div style="font-family: 'Abril Fatface';padding: 0rem 6rem 2rem;background-color: #84f7fd;text-transform: uppercase;font-size:1.6rem;color:#333;">${title}</div></div>`;
  rasterizeHTML.drawHTML(html, {
    executeJs: true,
  }).then(function (renderResult) {
    ctx.drawImage(renderResult.image, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
  });
};

refreshMasonry = function(delay) {
  Meteor.setTimeout(() => {
    this.masonry = new masonry( document.querySelector('.results-grid'), {
      // options...
      itemSelector: '.result-card',
      columnWidth: 400,
    });
  }, delay);
};

TemplateController('Home', {
  onCreated() {
    // this.autorun(() => {
    //   this.subscribe('lastSearchesAndTheirAnswers');
    //   this.subscribe('myCurrentSearchAndItsAnswers', this.state.newSearchId);
    // });
  },
  state: {
    newSearchId: null,
    searchLoading: false,
  },
  private: {
    masonry:null,
  },
  onRendered() {
    refreshMasonry({ delay: 1000 });
  },
  helpers: {
    allTags() {
      const allTags = _.uniq(_.flatten(Searches.find({
        wasModerated: true, selectedAnswerId: { $ne: null },
      }, {
        sort: {
          createdAt: -1,
        },
        limit: 20,
      }).map(search => search.originalTags)));
      // if (_.isEmpty(FlowRouter.getQueryParam('selectedValues'))) {
      //   FlowRouter.setQueryParams({
      //     'selectedValues': [_.last(allTags)],
      //   });
      // }
      return allTags;
    },
    selectedAnswers() {
      return Searches.find({
        wasModerated: true, selectedAnswerId: { $ne: null },
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
      refreshMasonry({ delay: 500 });
      return index !== -1;
    },
    newSearch() {
      return Searches.findOne(this.state.newSearchId);
    },
    getGoodTwitterImage(answerId) {
      Meteor.defer(() => {
        const selector = `.result-card[data-index="${answerId}"]`;

        const heightPx = this.$(selector).css('height');

        const goodHeight = 2.4 * parseInt(heightPx.substr(0, heightPx.length - 2));

        const answer = Answers.findOne(answerId);

        function callItAgainSam(base64 = false) {
          Meteor.call('getGoodTwitterImage', { answerId, height: goodHeight, base64 }, (err, res) => {
            if (err) {
              console.log(err);
            } else {
              if (res.status === 'processing') {
                Meteor.setTimeout(() => {
                  callItAgainSam(base64);
                }, 1000);
              }
            }
          });
        }

        toDataUrl(answer.text, answer.title, (base64Img) => {
          callItAgainSam(base64Img);
        }, 'image/png', goodHeight);
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

      Meteor.call('sendNewSearchAndFetch', { input: val }, (err, res) => {
        this.state.searchLoading = false;
        refreshMasonry({ delay: 500 });
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
    'click .js-cancel'(e) {
      this.state.newSearchId = null;
    },
  },
});

