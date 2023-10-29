require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const { URL } = require('url');
const { error } = require('console');
const app = express();

mongoose.connect(process.env.DB_URL)
  .then(() => console.log("Database connected successfully"))
  .catch((e) => console.log(e.message))
const { Schema, model } = mongoose;

const urlSchema = new Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
});

const Url = model('url', urlSchema)

// let x = new Url({ originalUrl: "https://twitter.com", shortUrl: '672' });
// x.save();
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  try {
    const myUrl = new URL(url);
    console.log(myUrl);
    dns.lookup(myUrl.hostname, async (err, address, family) => {
      if (!address) return res.json({ error: 'Invalid url' });

      let originalUrl = myUrl;
      let shortUrl = Math.floor(Math.random() * 100000);

      let newUrl = new Url({ originalUrl, shortUrl });
      await newUrl.save()

      res.json({ original_url: originalUrl, short_url: shortUrl })
    });

  } catch (error) {
    if(error.code == "ERR_INVALID_URL") return res.json({ error: 'Invalid url' });
    res.json({ error })
  }

});

app.get('/api/shorturl/:shorturl', async (req, res) => {
  const { shorturl } = req.params;

  try {
    const url = await Url.findOne({ shortUrl: shorturl })
    console.log(url)
    if (!url) return res.json(`Oops! url not found`)

    return res.redirect(url.originalUrl);

  } catch (error) {
    res.json({ error })
  }
})


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
