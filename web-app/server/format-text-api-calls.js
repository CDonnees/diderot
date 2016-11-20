import { HTTP } from 'meteor/http';
import _ from 'underscore';

FormatText = {
  getImageUrl({ text, ref }) {
    const url = 'http://api.page2images.com/html2image';
    const imageUrlRequest = HTTP.post(url, {
      params: {
        p2i_html: `<div style="width:800px;text-align:center;font-size:2rem;"><div style="font-family: 'Abril Fatface';padding: 0.5rem;background-color: white;letter-spacing: 0.4rem;text-transform: uppercase;font-size: 1.6rem;color:#333;"># Que Dirait Diderot ?</div><div style="font-family: 'Abril Fatface';padding: 3rem;color:#333;background-color: #84f7fd;">"${text}"</div><div style="font-family: 'Abril Fatface';padding: 0rem 6rem 2rem;background-color: #84f7fd;text-transform: uppercase;font-size:1.6rem;color:#333;">${ref}</div></div>`,
        // p2i_html: '<html><div>Yolo</div></html>',
        p2i_key: 'ea8fe257f32c4b77',
        p2i_size: '2400x0',
        p2i_screen: '800x600',
        p2i_fullpage: '0',
      },
    });
    return imageUrlRequest;
  },
};

// FormatText.getImageUrl({ text:'Vois-tu, mon jeune Trump, tu \'es qu\'une nouvelle recrue. Ceci dit pour ton édification, ami Trump, laisse-moi ajouter que je ne plaisantais nullement en exprimant la pensée que nous ne reverrions peut-être plus le Sborg, notre illustre chef.', ref:'Les ravageurs de la mer - 1980 - Louis Jacolliot' });

// FormatText.getImageUrl({ text:'Vois-tu, mon jeune Trump, tu \'es qu\'une nouvelle recrue. Ceci dit pour ton édification, ami Trump, laisse-moi ajouter que je ne plaisantais nullement en exprimant la pensée que nous ne reverrions peut-être plus le Sborg, notre illustre chef.', ref:'Les ravageurs de la mer - 1980 - Louis Jacolliot' });