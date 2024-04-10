require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
const dns = require('dns');
const urlparser = require('url');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(function(req, res, next){
  console.log (req.method + " " + req.path + " - " + req.ip);
  next();
})

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

let Url = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  dns.lookup(urlparser.parse(req.body.url).hostname, (err, address, family) => {
    if (!address) {
      res.json({error: 'Invalid URL'})
    } else {   
      // find if url already exists in db
      Url.findOne({original_url: req.body.url}, (err, UrlFound) => {
        if (err) return console.log(err);
        if (!UrlFound) {
          Url.countDocuments((err, count) => {
            if (err) return console.log(err);
            var shorttouse = count + 1;
              let newUrl = new Url({
                original_url: req.body.url,
                short_url: shorttouse
              })

              newUrl.save((err, data) => {
                if (err) return console.log(err);
              })

              res.json({original_url: req.body.url, short_url: shorttouse});
            })
        } else {
          res.json({original_url: req.body.url, short_url: UrlFound.short_url});
        }
      })
    }
  })
});

app.get('/api/shorturl/:shortcode', function(req, res) {
  Url.findOne({short_url: req.params.shortcode}, (err, UrlFound) => {
    if (err) return console.log(err);
    if (!UrlFound) {
      res.json({error: 'No short URL found for the given input'})
    } else {
      res.redirect(UrlFound.original_url);
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
