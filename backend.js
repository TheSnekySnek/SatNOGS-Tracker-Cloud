const express = require('express')

const axios = require('axios');
const app = express()
const port = 8080
const dotenv = require('dotenv')
dotenv.config()

// Load the TLE file from the S3 bucket
const AWS = require('aws-sdk')
const IS_GOOGLE = process.env.IS_GOOGLE || false
const AWS_KEY = process.env.AWS_KEY
const AWS_SECRET = process.env.AWS_SECRET
const BUCKET_NAME = process.env.BUCKET_NAME

var s3Config = {
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET
}

if (IS_GOOGLE) {
    s3Config.endpoint = "https://storage.googleapis.com"
}

const s3 = new AWS.S3(s3Config)

var lastTleUpdate = new Date()
var lastStationsUpdate = new Date()

function parseTLE(data) {
    var lines = data.split("\n")
    var tle = {}
    for (let i = 0; i < lines.length - 1; i += 3) {
        var id = lines[i + 2].split(' ')[1].trim()
        tle[id] = lines[i] + "\n" + lines[i + 1] + "\n" + lines[i + 2]
    }
    return tle
}

async function updateTleFile() {
    console.log("Updating TLEs")
    tle = await axios('https://www.celestrak.com/NORAD/elements/active.txt')
    tleData = parseTLE(tle.data)
    // Write the TLE file to the S3 bucket
    const params = {
        Bucket: BUCKET_NAME,
        Key: "tle.json",
        Body: JSON.stringify(tleData)
    }
    s3.putObject(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            console.log(data)
        }
    })
}

async function updateStationsFile() {
    return new Promise(async (resolve, reject) => {

        console.log("Updating Stations")
        var stations = []
        var done = false;
        var page = 1;
        do {
            var reqStr = "https://network.satnogs.org/api/stations/?page=" + page
            page++
            try {
                var body = await axios(reqStr)
                var data = body.data
                console.log(data)
                data.forEach(el => {
                    stations.push(el)
                });
            } catch (error) {
                console.log(error)
                done = true;
            }
            console.log(stations.length)
        } while (!done);
        
        // Write the stations file to the S3 bucket
        const params = {
            Bucket: BUCKET_NAME,
            Key: "stations.json",
            Body: JSON.stringify(stations)
        }
        s3.putObject(params, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

app.get('/api/tle', async (req, res) => {
    // Check if the TLE file is older than 24 hours
    if (new Date() - lastTleUpdate > 24 * 60 * 60 * 1000) {
        await updateTleFile()
        lastTleUpdate = new Date()
    }
    // Get the TLE file from the S3 bucket
    const params = {
        Bucket: BUCKET_NAME,
        Key: "tle.json"
    }
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            res.send(data.Body.toString())
        }
    })
})

app.get('/api/stations', async (req, res) => {
    // Check if the stations file is older than 24 hours
    if (new Date() - lastStationsUpdate > 24 * 60 * 60 * 1000) {
        await updateStationsFile()
        lastStationsUpdate = new Date()
    }
    // Get the stations file from the S3 bucket
    const params = {
        Bucket: BUCKET_NAME,
        Key: "stations.json"
    }
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err)
        } else {
            res.send(data.Body.toString())
        }
    })
})

updateStationsFile()
updateTleFile()

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})