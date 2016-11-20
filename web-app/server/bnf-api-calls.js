import { HTTP } from 'meteor/http';
import { parseString } from 'xml2js';
import _ from 'underscore';

/*
  To test in the shell: $ meteor shell:
  NPM
 */
const parseXML = ({ url }) => {
  const xml = HTTP.get(url).content;
  // console.log(xml);
  // console.log("=======");
  // console.log(parseString(xml));
  return Meteor.wrapAsync(parseString)(xml);
};

const sources = [
  {
    name: 'text',
    formatUrl(inputTags) {
      let searchQuery = `text%20all%20"${encodeURIComponent(inputTags.shift())}%20"`;
      console.log(inputTags);
      _.each(inputTags, (additionalInputTag) => {
        searchQuery = searchQuery + `+and%20text%20all%20"${encodeURIComponent(additionalInputTag)}"%20`;
      });
      console.log(searchQuery);

      return `http://gallica.bnf.fr/SRU?operation=searchRetrieve&exactSearch=false&collapsing=true&version=1.2&query=(${searchQuery})%20%20and%20(dc.language%20all%20%22fre%22)%20and%20(dc.type%20all%20%22manuscrit%22%20or%20dc.type%20all%20%22monographie%22%20or%20dc.type%20all%20%22fascicule%22)%20and%20(ocr.quality%20all%20%22texte%20disponible%22)%20and%20(provenance%20adj%20%22bnf.fr%22)&suggest=10`;
    },
    getTagOccurences(arkId, tag) {
      const url = `http://gallica.bnf.fr/services/ContentSearch?ark=${arkId}&query=${encodeURIComponent(tag)}`;
      const xml = parseXML({ url });
      console.log(xml);
    },
    get(inputTags) {
      console.log('=========');
      const url = this.formatUrl(inputTags);
      console.log(url);

      // Retrieve all contents that contain all the words
      const contentListXML = parseXML({ url });
      // console.log(contentListXML);
      const documents = _.map(contentListXML['srw:searchRetrieveResponse']['srw:records'][0]['srw:record'], (record) => {
        console.log(record['srw:recordData'][0]['oai_dc:dc']);
        const recordUrl = record['srw:recordData'][0]['oai_dc:dc'][0]['dc:identifier'][0];
        const recordTitle = record['srw:recordData'][0]['oai_dc:dc'][0]['dc:title'][0];
        const arkId = _.last(recordUrl.split('/'));
        console.log(arkId);

        // const ocs = _.map(inputTags, tag => this.getTagOccurences(arkId, tag));

        return {
          // arkId,
          // oc: _.map(inputTags, tag => this.getTagOccurences),
        };
      });
      
      // console.log(documents);
      return [];
    },
  },
];

BNF = {
  fetchAnswers({ inputTags }) {
    return _.flatten(_.map(sources, source => source.get(inputTags)));
  },
};
