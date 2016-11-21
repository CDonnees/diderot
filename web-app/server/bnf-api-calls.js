import { HTTP } from 'meteor/http';
import xml2js from 'xml2js';
import striptags from 'striptags';
import _ from 'underscore';

function indexOfMin(arr) {
  if (arr.length === 0) {
    return -1;
  }

  let min = arr[0];
  let minIndex = 0;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i;
      min = arr[i];
    }
  }

  return minIndex;
}

const parseString = xml2js.parseString;
/*
  To test in the shell: $ meteor shell:
  NPM
 */
const parseXML = ({ url }) => {
  try {
    const req = HTTP.get(url);
    const xml = req.content;

    try {
      return Meteor.wrapAsync(parseString, xml2js)(xml);
    } catch(e) {
      console.log(e);
    }
  } catch(e) {
    console.log('ERREUR URL', url);
  }
};

const sources = [
  {
    name: 'text',
    formatUrl(inputTags) {
      console.log(inputTags);
      let searchQuery = `text%20all%20"${encodeURIComponent(inputTags[0])}%20"`;

      _.each(_.rest(inputTags), (additionalInputTag) => {
        searchQuery = searchQuery + `+and%20text%20all%20"${encodeURIComponent(additionalInputTag)}"%20`;
      });

      return `http://gallica.bnf.fr/SRU?operation=searchRetrieve&exactSearch=false&collapsing=true&version=1.2&query=(${searchQuery})%20%20and%20(dc.language%20all%20%22fre%22)%20and%20(dc.type%20all%20%22manuscrit%22%20or%20dc.type%20all%20%22monographie%22%20or%20dc.type%20all%20%22fascicule%22)%20and%20(ocr.quality%20all%20%22texte%20disponible%22)%20and%20(provenance%20adj%20%22bnf.fr%22)&suggest=10`;
    },
    getTagOccurences(arkId, tag) {
      const url = `http://gallica.bnf.fr/services/ContentSearch?ark=${arkId}&query=${encodeURIComponent(tag)}`;
      const xml = parseXML({ url });
      if (xml) {
        return parseInt(xml.results.$.countResults);
      }
      return 10000000;
    },
    getQuotesFromTag(arkId, tag) {
      const url = `http://gallica.bnf.fr/services/ContentSearch?ark=${arkId}&query=${encodeURIComponent(tag)}`;

      const xml = parseXML({ url });
      if (xml) {
        // console.log(xml.results.items[0]);
        const res = _.map(xml.results.items[0].item, item => item.content[0]);
        return res;
      }
    },
    containOtherWords(quotes, otherWords) {
      return _.filter(quotes, (quote) => {
        return _.every(otherWords, otherWord => quote.toLowerCase().indexOf(otherWord.toLowerCase()) !== -1);
      });
    },
    areWellOCR(quotes) {
      return _.filter(quotes, (quote) => {
        const doesNotContainsWeirdChars =
          (quote.indexOf('~') === -1)
          && (quote.indexOf('\\\\') === -1)
          && (quote.indexOf('©') === -1)
          && (quote.indexOf(';;') === -1)
          && (quote.indexOf(',,') === -1);

        const doesNotContainTooManyParenthesis = quote.split('(').length < 2 || quote.split(')').length < 2;

        return doesNotContainsWeirdChars && doesNotContainTooManyParenthesis;
      });
    },
    haveGoodSizesQuotes(quotes, tags) {
      return _.filter(quotes, (quote) => {
        let quoteWithoutTags = striptags(quote.toLowerCase()).replace(tags[0].toLowerCase(), '');
        _.each(_.rest(tags), (additionalInputTag) => {
          quoteWithoutTags = quoteWithoutTags.replace(additionalInputTag, '');
        });

        return (quoteWithoutTags.length > 30) && (quoteWithoutTags.length < 280);
      });
    },
    get(inputTags) {
      console.log('=========');
      const url = this.formatUrl(inputTags);

      // Retrieve all contents that contain all the words
      const contentListXML = parseXML({ url });

      const documents = _.compact(_.flatten(_.map(contentListXML['srw:searchRetrieveResponse']['srw:records'][0]['srw:record'], (record) => {
        const recordUrl = record['srw:recordData'][0]['oai_dc:dc'][0]['dc:identifier'][0];
        const recordTitle = record['srw:recordData'][0]['oai_dc:dc'][0]['dc:title'][0].substr(0, 100).replace('é', 'e').replace('ê', 'e').replace('î', 'i').replace('è', 'e')+'...';
        const imageUrl = record['srw:extraRecordData'][0]['thumbnail'][0];

        const splitUrl = recordUrl.split('/');
        const arkId = _.last(splitUrl);
        if (arkId !== 'date') {
          // Periodics have a different behaviour
          const ocs = _.map(inputTags, tag => this.getTagOccurences(arkId, tag));

          const minOcWord = inputTags[indexOfMin(ocs)];

          const quotes = this.getQuotesFromTag(arkId, minOcWord);
          if (quotes) {
            const otherwordQuotes = this.containOtherWords(quotes, _.without(inputTags, [minOcWord]));
            const wellOcrQuotes = this.areWellOCR(otherwordQuotes);
            const goodSizeQuotes = this.haveGoodSizesQuotes(wellOcrQuotes, inputTags);

            return _.map(goodSizeQuotes, (quote) => {
              return {
                resourceUrl: recordUrl,
                title: recordTitle,
                imageUrl,
                arkId,
                text: striptags(quote.replace('é', 'e').replace('è', 'e').replace('ê', 'e').replace('î', 'i')),
              };
            });
          }
        }
      }), true));

      // console.log(documents);
      return documents;
    },
  },
];

BNF = {
  fetchAnswers({ inputTags }) {
    return _.sortBy(_.flatten(_.map(sources, source => source.get(inputTags))), answer => -answer.text.length);
  },
};
