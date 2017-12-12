var marked = require('marked');
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var readFiles = require('fs-readdir-recursive');
var del = require('delete');
var archiver = require('archiver');
var copy = require('ncp');

var package = require('./package.json');

var version = package.version;

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

var filesInputDirectory = path.join(__dirname, "../Allfiles/");
var docLabsInputDirectory = path.join(__dirname, "../Instructions/Labs/");
var docDemosInputDirectory = path.join(__dirname, "../Instructions/Demos/");
var tempDirectory = path.join(__dirname, "tmp");
var docsTempDirectory = path.join(tempDirectory, "Instructions/");
var filesTempDirectory = path.join(tempDirectory, "AllFiles/");
var outputDirectory = path.join(__dirname, "out");
var filesOutputZip = path.join(outputDirectory, "allfiles-v" + version + ".zip");
var docsOutputZip = path.join(outputDirectory, "lab_instructions-v" + version + ".zip");

if (fs.existsSync(tempDirectory)) {
    del.sync([tempDirectory]);
}
fs.mkdirSync(tempDirectory);
if (fs.existsSync(outputDirectory)) {
    del.sync([outputDirectory]);
}
fs.mkdirSync(outputDirectory);
if (fs.existsSync(docsTempDirectory)) {
    del.sync([docsTempDirectory]);
}
fs.mkdirSync(docsTempDirectory);
createLabDemosZip(function() {
    createAllFilesZip(function() {
        cleanup();
    });
});

function createLabDemosZip(callback) {
    console.log('Generating File:', docsOutputZip);
    var labFiles = readFiles(docLabsInputDirectory);
    labFiles.forEach(function(fileName, index) {
        console.log("Lab File:\t" + fileName);
        buildDocx(path.join(docLabsInputDirectory, fileName), path.basename(fileName, '.md'));
    });
    var labFiles = readFiles(docDemosInputDirectory);
    labFiles.forEach(function(fileName, index) {
        console.log("Demo File:\t" + fileName);
        buildDocx(path.join(docDemosInputDirectory, fileName), path.basename(fileName, '.md'));
    });
    var labOutput = fs.createWriteStream(docsOutputZip);
    var labArchive = archiver.create('zip', {});
    labArchive.pipe(labOutput);
    labArchive.directory(docsTempDirectory, false, { date: new Date() });
    labArchive.finalize();
    labOutput.on('close', function() {
        console.log('Lab & Demos Archive Created');
        callback();
    });
}

function createAllFilesZip(callback) {
    console.log('Generating File:', filesOutputZip);
    copy.ncp(filesInputDirectory, filesTempDirectory, function(error) {
        var filesOutput = fs.createWriteStream(filesOutputZip);
        var filesArchive = archiver.create('zip', {});
        filesArchive.pipe(filesOutput);
        filesArchive.directory(filesTempDirectory, false, { date: new Date() });
        filesArchive.finalize();
        filesOutput.on('close', function() {
            console.log('AllFiles Archive Created');
            callback();
        });
    });
}

function cleanup() {
    console.log('Cleaing Up Temporary Folders');
    del.sync([tempDirectory]);
}

function buildDocx(markdownPath, baseFileName) {
    var htmlFilePath = createHtmlFile(markdownPath, baseFileName + '.html');
    var docxFilePath = createDocxFile(htmlFilePath, baseFileName + '.docx');
    deleteHtmlFile(htmlFilePath);
    return docxFilePath;
}

function createHtmlFile(markdownPath, newFileName) {
    var markdownString = fs.readFileSync(markdownPath, 'utf8');
    var htmlString = marked(markdownString);
    var outPath = path.join(docsTempDirectory, newFileName);
    fs.writeFileSync(outPath, htmlString);
    return outPath;
}

function deleteHtmlFile(htmlPath) {
    fs.unlinkSync(htmlPath);
}

function createDocxFile(htmlPath, newFileName) {
    var outPath = path.join(docsTempDirectory, newFileName);
    cp.execFileSync('pandoc', [htmlPath, '--reference-doc=template.docx', '-o', outPath]);
}