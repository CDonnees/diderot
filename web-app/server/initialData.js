const textCsv = Assets.getText('test2.csv');
// console.log(textCsv);

const parsedCsv = Papa.parse(textCsv, {
  header: true,
});
// console.log(parsedCsv);

InitialData = _.compact(_.map(parsedCsv.data, (row) => {
  if (!_.isEmpty(row.originalInput)) {
    return {
      search: {
        originalInput: row.originalInput,
        originalTags: Searches.getTagsFromInput(row.originalInput),
        finalInput: row.finalInput,
        finalInputTags: Searches.getTagsFromInput(row.finalInput),
        searchField: row.searchField,
        filters: row.filters,
        wasModerated: true,
      },
      answer: {
        title: row.title,
        text: row.text,
        resourceUrl: row.resourceUrl,
        shortenedResourceUrl: Answers.shortenUrl(row.resourceUrl),
        // arkId: Answers.extractArkIdFromUrl(row.resourceUrl),
        imageUrl: row.imageUrl,
        finalMessage: row.finalMessage,
        finalImage: row.finalImage,
      },
    };
  }
}));





