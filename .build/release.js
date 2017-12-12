var ghRelease = require('gh-release');
var del = require('delete');
var path = require('path');

var package = require('./package.json');

var version = package.version;

var outputDirectory = "out";
var filesOutputZip = path.join(outputDirectory, "allfiles-v" + version + ".zip");
var docsOutputZip = path.join(outputDirectory, "lab_instructions-v" + version + ".zip");

var options = {
    tag_name: 'v' + version,
    target_commitish: 'master',
    name: 'v' + version,
    repo: 'automatedbuildtest',
    owner: 'seesharprun',
    prerelease: true,
    endpoint: 'https://api.github.com',
    auth: {
        token: process.env.GITHUB_TOKEN
    },
    assets: [
        filesOutputZip,
        docsOutputZip
    ]
};

ghRelease(options, function (err, result) {
    if (err) throw err
    console.log(result);
});