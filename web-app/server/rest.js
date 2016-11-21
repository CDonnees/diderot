// Global API configuration
const Api = new Restivus({
  useDefaultAuth: false,
  defaultHeaders: { 'Content-Type': 'text/html' },
  prettyJson: true,
});

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Maps to: /api/articles/:id
Api.addRoute('answer/:id', {}, {
  get() {
    const search = Searches.findOne({
      selectedAnswerId: this.urlParams.id,
    });
    const answer = Answers.findOne(this.urlParams.id);


    if (answer) {
      // return Articles.findOne(this.urlParams.id);
      return  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta property='twitter:card', content='summary_large_image'/><meta property='twitter:site', content='@Diderotbot'/><meta property='twitter:creator', content='@Diderotbot'/><meta property='twitter:title', content='${htmlEscape(search.originalTags.join(', '))} sur le Diderobot !'/><meta property='twitter:description', content='${htmlEscape(answer.text || answer.title)}'/><meta name='twitter:image' content='${htmlEscape(answer.finalImage)}'/><meta property='twitter:url', content='${Meteor.absoluteUrl()}api/answer/${answer._id}'/></head><body><script type="text/javascript"> window.setTimeout(function() {window.location="${htmlEscape(answer.resourceUrl)}"}, 700);</script></body></html>`;
    }
  },
});
