// Global API configuration
const Api = new Restivus({
  useDefaultAuth: false,
  defaultHeaders: { 'Content-Type': 'text/html' },
  prettyJson: true,
});


// Maps to: /api/articles/:id
Api.addRoute('answer/:id', {}, {
  get() {
    const search = Searches.findOne({
      selectedAnswerId: this.urlParams.id,
    });
    const answer = Answers.findOne(this.urlParams.id);

    if (answer) {
      // return Articles.findOne(this.urlParams.id);
      return  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta property='twitter:card', content='summary_large_image'/><meta property='twitter:site', content='@Diderotbot'/><meta property='twitter:creator', content='@Diderotbot'/><meta property='twitter:title', content='${search.originalTags.join(', ')} sur le Diderobot !'/><meta property='twitter:description', content='${answer.text || answer.title}'/><meta name='twitter:image' content='${answer.finalImage}'/><meta property='twitter:url', content='${Meteor.absoluteUrl()}api/answer/${answer._id}'/></head><body><script type="text/javascript"> window.setTimeout(function() {window.location="${answer.resourceUrl}"}, 300);</script></body></html>`;
    }
  },
});
