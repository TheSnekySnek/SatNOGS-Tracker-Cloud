const web = require("./web")
const axios = require('axios');
const fs = require('fs');


const maxTime = 24;

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

Date.prototype.getSatTime = function () {

    return "" + this.getUTCFullYear() + "-" + ("0" + (this.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + this.getUTCDate()).slice(-2) + "T" + ("0" + this.getUTCHours()).slice(-2) + ":" + ("0" + this.getUTCMinutes()).slice(-2) + ":" + ("0" + this.getUTCSeconds()).slice(-2) + "Z";
}

function updateTLE() {
    console.log("Updating TLEs")
    request('https://www.celestrak.com/NORAD/elements/active.txt', function (error, response, body) {
        if (error)
            console.log(error)
        var TLES = parseTLE(body)
        //fs.writeFileSync("./www/tle.json", JSON.stringify(TLES))
        writeToBucket("tle.json", JSON.stringify(TLES))
    });
}

function updateStations() {
    console.log("Updating Stations")
    var stations = []
    var done = false;
    var page = 1;
    do {
        var reqStr = "https://network.satnogs.org/api/stations/?page=" + page
        page++
        try {
            var body = srequest("GET", reqStr).getBody()
            var data = JSON.parse(body)
            data.forEach(el => {
                stations.push(el)
            });
        } catch (error) {
            done = true;
        }
    } while (!done);
    //fs.writeFileSync("./www/stations.json", JSON.stringify(stations))
    writeToBucket("stations.json", JSON.stringify(stations))
}

function updateObservations() {
    console.log("Updating Observations")
    var time = new Date().addHours(-1)
    var nt = new Date().addHours(maxTime)
    var observations = []
    var done = false;
    var page = 1;
    do {
        var reqStr = "https://network.satnogs.org/api/observations?start=" + time.getSatTime() + "&end=" + nt.getSatTime() + "&page=" + page
        page++
        try {
            var body = srequest("GET", reqStr).getBody()
            var data = JSON.parse(body)
            data.forEach(el => {
                observations.push(el)
            });
        } catch (error) {
            done = true;
        }
    } while (!done);
    observations.sort(function(a, b){
        var keyA = Date.parse(a.start),
            keyB = Date.parse(b.start);
        // Compare the 2 dates
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });
    //fs.writeFileSync("./www/observations.json", JSON.stringify(observations))
    writeToBucket("observations.json", JSON.stringify(observations))
}


function writeToBucket(filename, data) {
    var params = {
        Bucket: BUCKET_URL,
        Key: filename,
        Body: data
    };
    s3.upload(params, function (s3Err, data) {
        if (s3Err) throw s3Err
        console.log(`File uploaded successfully at ${data.Location}`)
    });
}

updateTLE()
updateStations()
updateObservations()