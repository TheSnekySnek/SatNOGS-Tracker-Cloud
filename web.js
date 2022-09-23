const express = require('express')
const axios = require('axios');
var app = express();
var port = 3000;
const dotenv = require('dotenv')
dotenv.config()

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080"

app.use(express.static('www'))

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}

Date.prototype.getSatTime = function () {
  return "" + this.getUTCFullYear() + "-" + ("0" + (this.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + this.getUTCDate()).slice(-2) + "T" + ("0" + this.getUTCHours()).slice(-2) + ":" + ("0" + this.getUTCMinutes()).slice(-2) + ":" + ("0" + this.getUTCSeconds()).slice(-2) + "Z";
}

async function getObservations(start, end) {
  return new Promise(async (resolve, reject) => {
    var observations = []
    var done = false;
    var page = 1;
    do {
      var reqStr = "https://network.satnogs.org/api/observations?start=" + start.getSatTime() + "&end=" + end.getSatTime() + "&page=" + page
      
      page++
      try {
        var body = await axios(reqStr)
        var data = body.data
        data.forEach(el => {
          observations.push(el)
        });
      } catch (error) {
        done = true;
      }
    } while (!done);
    observations.sort(function (a, b) {
      var keyA = Date.parse(a.start),
        keyB = Date.parse(b.start);
      // Compare the 2 dates
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    });
    resolve(observations)
  })
}

async function getTLE() {
  return (await axios(BACKEND_URL + "/api/tle")).data;
}

async function getStations() {
  return (await axios(BACKEND_URL + "/api/stations")).data;
}

app.get('/api/observations', async (req, res) => {
  console.log(req.query)
  var start = new Date(parseInt(req.query.start))
  var end = new Date(parseInt(req.query.end))
  var observations = await getObservations(start, end)
  res.send(observations)
})

app.get('/api/tle', async (req, res) => {
  var tle = await getTLE()
  res.send(tle)
})

app.get('/api/stations', async (req, res) => {
  var stations = await getStations()
  res.send(stations)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})