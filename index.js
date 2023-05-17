const cheerio = require('cheerio');
const axios = require('axios');
const http = require('http');
const nodemailer = require('nodemailer');

const SENDER_MAIL = process.env.SENDER_MAIL;
const SENDER_PASS = process.env.SENDER_PASS;
const RECIEVER_MAIL = process.env.RECIEVER_MAIL;

// Get html of url
const getHtml = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    console.log(err);
  }
};

const getFlipkartPrice = async (url) => {
  const html = await getHtml(url);
  const $ = cheerio.load(html);
  const price = $('.dyC4hf ._25b18c ._30jeq3._16Jk6d')
    .text()
    .split('₹')[1]
    .split(',')
    .join('');
  return price;
};

const sendMail = async (price) => {
  // Use outlook for transport service
  const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: SENDER_MAIL,
      pass: SENDER_PASS,
    },
  });

  const mailOptions = {
    from: SENDER_MAIL,
    to: RECIEVER_MAIL,
    subject: 'Important: Price dropped',
    text: `The price dropped to ${price}!`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

http
  .createServer(async (req, res) => {
    if (req.url === '/check-price') {
      const price = await getFlipkartPrice(
        'https://www.flipkart.com/nothing-phone-1-black-128-gb/p/itmeea53a564de47'
      );
      if (price < 30001) {
        await sendMail(price);
        console.log('Price dropped');
        res.write('Price dropped');
        res.end();
      } else {
        console.log('Price not dropped');
        res.write('Price not dropped');
        res.end();
      }
    } else {
      res.write('Server running');
      res.end();
    }
  })
  .listen(process.env.PORT || 3000, () =>
    console.log('Server running on port 3000')
  );
