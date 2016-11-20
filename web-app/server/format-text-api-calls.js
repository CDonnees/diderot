import { HTTP } from 'meteor/http';
import _ from 'underscore';

FormatText = {
  getImageUrl({ text }) {
    const url = 'http://www.imageCreationHTMLYolo';
    const imageUrlRequest = HTTP.post(url, {
      data: {
        text,
      },
    });
    return imageUrlRequest;
  },
};

