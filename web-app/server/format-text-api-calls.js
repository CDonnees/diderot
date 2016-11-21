import { HTTP } from 'meteor/http';
import { EJSON } from 'meteor/ejson';
import _ from 'underscore';
import phantomProxy from 'phantom-proxy';
import assert from 'assert';
import AWS from 'aws-sdk';
/*

  Create policy for our user, allowing only uploading and deleting for your s3 bucket
  See http://stackoverflow.com/questions/6615168/is-there-an-s3-policy-for-limiting-access-to-only-see-access-one-bucket

  Create public bucket policy
  with https://ariejan.net/2010/12/24/public-readable-amazon-s3-bucket-policy/


  Then config here with direct config see
  http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
 */
AWS.config = new AWS.Config({
  accessKeyId: Meteor.settings['aws-access-key'],
  secretAccessKey: Meteor.settings['aws-secret-key'],
  region: Meteor.settings['aws-region'],
});
const s3Bucket = new AWS.S3({ params: {
  Bucket: Meteor.settings['aws-s3-bucket'],
} });
// import fs from 'fs';
// const credPath = fs.realpathSync(`${process.cwd()}/assets/app/prod-cred-config.json`);

// console.log(credPath);
// console.log(process.env.PWD);
// process.env.AWS_ACCESS_KEY_ID = Meteor.settings['aws-access-key'];
// process.env.AWS_SECRET_ACCESS_KEY = Meteor.settings['aws-secret-key'];
// AWS.config.loadFromPath(credPath);

const template = ({ text, title }) => {
  return `<html><head><link rel='stylesheet' type='text-css' href='https://fonts.googleapis.com/css?family=Abril+Fatface'></head><script src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js"></script><script>WebFont.load({google: {families: ['Abril Fatface']}});</script><body><style>@font-face {font-family: 'Abril Fatface'; src: url('abril-fatface/AbrilFatface-Regular.otf') format('opentype'); font-style: normal;}</style><div style="width:800px;text-align:center;font-size:2rem; font-family: 'Abril Fatface', cursive;"><div style="font-family: 'Abril Fatface';padding: 0.5rem;background-color: white;letter-spacing: 0.4rem;text-transform: uppercase;font-size: 1.6rem;color:#333;"># Que Dirait Diderot ?</div><div style="font-family: 'Abril Fatface';padding: 3rem;color:#333;background-color: #84f7fd;">"${text}"</div><div style="font-family: 'Abril Fatface';padding: 0rem 6rem 2rem;background-color: #84f7fd;text-transform: uppercase;font-size:1.6rem;color:#333;">${title}</div></div></body></html>`;
};

FormatText = {
  getImageUrl({ answerId, text, title, height, base64 }) {
    if (base64) {
      return {
        status: 'finished',
        image_url: this._onlySendbase64ToS3({ answerId, base64 }),
      };
    }

    return {
      status: 'finished',
      image_url: this._renderUsingPhantomJs({ answerId, text, title, height }),
    };
  },
  // Deprecated, ancient method
  _getpage2Image({ answerId, text, title, height }) {
    const url = 'http://api.page2images.com/html2image';
    const imageUrlRequest = HTTP.post(url, {
      params: {
        p2i_html: template({ text, title }),
        // p2i_html: '<html><div>Yolo</div></html>',
        p2i_key: 'ea8fe257f32c4b77',
        p2i_size: '2400x0',
        p2i_screen: `800x${height}`,
        p2i_fullpage: '0',
      },
    });
    return EJSON.parse(imageUrlRequest.content);
  },
  // render canvas client http://cburgmer.github.io/rasterizeHTML.js/
  // Then + slingshot might be possible to do http://stackoverflow.com/questions/13990673/upload-canvas-data-to-s3
  // But on the server with phantomJS (not scalable)
  // http://stackoverflow.com/questions/7511321/uploading-base64-encoded-image-to-amazon-s3-via-node-js
  _renderUsingPhantomJs({ answerId, text, title, height }) {
    // http://gojs.net/latest/intro/serverSideImages.html
    phantomProxy.create({ debug: true }, (proxy) => {
      const page = proxy.page;
      page.set('viewportSize', {
        width: 800,
        height,
      });
      page.settings.userAgent = 'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36';
      page.set('content', template({ text, title }));

      page.on('loadFinished', () => {
        // We do this to allow font rendering
        // but in fact it does not work. Really complex to have in phantomJS pre 2.0
        setTimeout(() => {
          // page.renderBase64('PNG', (result) => {
          //   const buf = new Buffer(result, 'base64');
          //   const objData = {
          //     Key: answerId,
          //     Body: buf,
          //     ContentEncoding: 'base64',
          //     ContentType: 'image/png',
          //   };
          //   s3Bucket.putObject(objData, (err, data) => {
          //     if (err) {
          //       console.log(err);
          //       console.log('Error uploading data: ', data);
          //     } else {
          //       console.log('succesfully uploaded the image!', data);
          //     }
          //   });
          // });
          // console.log(answerId);
          // To render to filesystem
          page.render('/Users/mcoenca/Documents/Societe/Bnf-Diderot/diderot/images/' + answerId +'.png', (result) => {
            assert.equal(result, true);

            setTimeout(() => {
              proxy.end(() => {
                console.log('done');
              });
            },
            2);
          });
        }, 4000);
      });
    });
    console.log('return');
    return `${Meteor.settings.public.s3bucket}${answerId}.png`;
  },
  _onlySendbase64ToS3({ answerId, base64 }) {
    const buf = new Buffer(base64.replace('data:image/png;base64,', ''), 'base64');
    const objData = {
      Key: answerId + '.png',
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: 'image/png',
    };
    s3Bucket.putObject(objData, (err, data) => {
      if (err) {
        console.log(err);
        console.log('Error uploading data: ', data);
      } else {
        console.log('succesfully uploaded the image!', data);
      }
    });
    return `${Meteor.settings.public.s3bucket}${answerId}.png`;
  },
};

// FormatText._renderUsingPhantomJs({ answerId: 'test-id', text:'Vois-tu, mon jeune Trump, tu \'es qu\'une nouvelle recrue. Ceci dit pour ton édification, ami Trump, laisse-moi ajouter que je ne plaisantais nullement en exprimant la pensée que nous ne reverrions peut-être plus le Sborg, notre illustre chef.', ref:'Les ravageurs de la mer - 1980 - Louis Jacolliot' });

// FormatText.getImageUrl({ text:'Vois-tu, mon jeune Trump, tu \'es qu\'une nouvelle recrue. Ceci dit pour ton édification, ami Trump, laisse-moi ajouter que je ne plaisantais nullement en exprimant la pensée que nous ne reverrions peut-être plus le Sborg, notre illustre chef.', ref:'Les ravageurs de la mer - 1980 - Louis Jacolliot' });
