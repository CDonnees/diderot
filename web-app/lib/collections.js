import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import google from 'google-url';

Searches = new Mongo.Collection('searches');

Searches.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  userId: { type: String, optional: true },
  originalTweet: { type: String, optional: true },
  userHandle: { type: String, optional: true },
  originalInput: { type: String }, // Hashtags
  originalTags: { type: [String], optional: true },
  finalInput: { type: String, optional: true },
  finalTags: { type: [String], optional: true },
  searchField: { type: String, optional: true }, // Si ca a ete cherche dans text titre, etc
  filters: { type: String, optional: true }, // si ca ete restreint a image, livres ou aucun
  answersIds: { type: [String], defaultValue: [] },
  selectedAnswerId: { type: String, optional: true },
  wasModerated: { type: Boolean, defaultValue: false },
  createdAt: {
    type: Date,
    autoValue() { if (this.isInsert) return new Date(); },
    optional: true,
  },
});

Searches.attachSchema(Searches.schema);


Answers = new Mongo.Collection('answers');

Answers.schema = new SimpleSchema({
  _id: { type: String, regEx: SimpleSchema.RegEx.Id },
  title: { type: String },
  text: { type: String, optional: true }, // if not, this is an image
  arkId: { type: String, optional: true }, // Gallica Id
  resourceUrl: { type: String }, // BNF resource
  shortenedResourceUrl: { type: String, optional: true }, // BNF resource
  imageUrl: { type: String, optional: true }, // Image from BNF
  finalMessage: { type: String, optional: true },
  // Tweeted Message: should respect this format:
  // https://twitter.com/intent/tweet?hashtags=QueDiraitDiderot,Trump&text=yolo+swag&url=http%3A%2F%2Fbit.ly%2F24qiD3N&via=Diderobot"
  finalImage: { type: String, optional: true }, //Tweeted Image
});

Answers.attachSchema(Answers.schema);

const googleUrl = new google({key: 'AIzaSyBokNgRjqCZ9L8WYpT3V4RWv2XspOjaF9U'});
Answers.shortenUrl = url => {
  try {
    const newUrl = Meteor.wrapAsync(googleUrl.shorten, googleUrl)(url);
    return newUrl;
  } catch (e) {
    return url;
  }
};

Searches.getTagsFromInput = (input) => {
  return _.map(input.split(' '), hashtag => hashtag.replace('#', ''));
};

Searches.fetchAnswers = ({ searchId }) => {
  if (Meteor.isServer) {
    const search = Searches.findOne(searchId);
    if (search) {
      const goodInputTags = _.isEmpty(search.finalTags) ? search.originalInputTags : search.finalTags;
      const answers = BNF.fetchAnswers({ inputTags: goodInputTags });
      const answersIds = _.map(answers, (answer) => {
        return Answers.insert(answer);
      });
      Searches.update({ _id: searchId }, {
        $set: {
          answersIds,
        },
      });
    }
  }
};

Searches.createSearch = ({ input }) => {
  return Searches.insert({
    originalInput: input,
    originalTags: Searches.getTagsFromInput(input),
  });
};

Searches.newInputAndFetchAnswers = ({ searchId, newInput }) => {
  let goodInput = newInput;
  if (!newInput) {
    goodInput = Searches.findOne(searchId).originalInput;
  }

  if (goodInput) {
    Searches.update({
      _id: searchId,
    }, {
      $set: {
        finalInput: goodInput,
        finalTags: Searches.getTagsFromInput(goodInput),
      },
    });

    Searches.fetchAnswers({ searchId });
  }
};

Searches.validateAnswer = ({ searchId, answerId }) => {
  Searches.update({
    _id: searchId,
  }, {
    $set: { selectedAnswerId: answerId },
  });
};

Searches.validateForModeration = ({ searchId }) => {
  const search = Searches.findOne(searchId);
  if (!_.isEmpty(search.answersIds) && !_.isEmpty(search.selectedAnswerId)) {
    Searches.update({
      _id: searchId,
    }, {
      $set: { wasModerated: true, },
    });

    if (search.originalTweet && search.userHandle) {
      // XXX Send back from twitter backend
    }
  }
};

Answers.getGoodTwitterImage = ({
  answerId,
  height,
}) => {
  const answer = Answers.findOne(answerId);
  const imageReq = FormatText.getImageUrl({ text: answer.text, title: answer.title });
  if (imageReq.content) {
    console.log(imageReq.content);
    console.log(EJSON.parse(imageReq.content));
  }
};

Searches.helpers({
  answers() {
    return Answers.find({
      _id: {
        $in: this.answersIds,
      },
    });
  },
  goodAnswer() {
    return Answers.findOne({
      _id: this.selectedAnswerId,
    });
  },
});

