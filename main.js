/*
 The MIT License (MIT)

 Copyright (c) 2015 Oguz Bastemur

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

var log = require('color-log');
var rex = require('./regexp_html');
var fs_util = require('./fs_utils');
var statistic = require('./statistics');
var fs = require('fs');
var path = require('path');

if (!fs.existsSync('out/')) {
  info.error("run bin/compile_path first to compile the data");
  process.exit(0);
}

// Collect all the HTML file names
var files = fs_util.searchPathForExtension('out/', 'html');

var dict = {};

var documentCount = 0;
// index the files and calculate term frequency
for (var i = 0, ln = files.length; i < ln; i++) {
  var file = files[i];
  process.stdout.write(".");

  var data = fs.readFileSync(file) + "";
  data = rex.getWordMap(data);
  data = rex.normalizeByEnding(data, 's');
  data = rex.normalizeByEnding(data, 'es');
  data = rex.normalizeByEnding(data, 'ies');
  data.calculateTermFrequency();

  dict[file] = data;
  documentCount++;
}

console.log("");

// calculate inverse document frequency per each term
var terms = {};
for (var file in dict) {
  if (!dict.hasOwnProperty(file)) continue;
  var document = dict[file];

  for (var word in document._words) {
    if (!document._words.hasOwnProperty(word)) continue;

    if (!terms.hasOwnProperty(word)) {
      terms[word] = {count: 1};
      terms[word].termFrequency = document._words[word].termFrequency;
    } else {
      terms[word].count++;
      terms[word].termFrequency += document._words[word].termFrequency;
    }
  }
}

var wordCount = 0;
var maxFactor = 0;
var maxImportantWord;
for (var word in terms) {
  if (!terms.hasOwnProperty(word)) continue;

  var wd = terms[word];

  // smooth idf
  wd.termFrequency = parseFloat(wd.termFrequency / wd.count);
  if (wd.termFrequency == null) {
    debugger;
  }

  wd.inverseDocumentFrequency = statistic.inverseDocumentFrequency(wd.count, documentCount);
  wd.importanceFactor = statistic.importantFactor(wd.termFrequency, wd.inverseDocumentFrequency);

  if (wd.importanceFactor > maxFactor) {
    maxFactor = wd.importanceFactor;
    maxImportantWord = word;
  }
  wordCount++;
}

log.info("Maximum importance factor", maxFactor, "word", maxImportantWord);
log.info("Total Files", files.length);
log.info("Total Words", wordCount);
log.info("dec", JSON.stringify(terms['dec'], null, 2));
log.info("the", JSON.stringify(terms['the'], null, 2));
log.info("homeworks", JSON.stringify(terms['homeworks'], null, 2));