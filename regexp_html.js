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

var statistic = require('./statistics');

exports.clearHTMLTag = function (data_) {
  var data = data_; // copy reference

  // cleanup HTML
  var testHTML = new RegExp("([<]+[^>]*[>]+)", "g");
  var lstHTML = data.match(testHTML);
  for (var o in lstHTML) {
    if (!lstHTML.hasOwnProperty(o)) continue;

    data = data.replace(lstHTML[o], " ");
  }

  return data;
};

exports.clearSpaceAndBreak = function (data, replace_to) {
  if (!replace_to && replace_to !== 0)
    replace_to = " ";

  // cleanup empty spaces
  return data.replace(/[ \r\n]+/g, replace_to);
};

var wordCut = function (data, loc, len) {
  var left = data.substr(0, loc);
  var right = data.substr(loc + len);

  return left + " " + right;
};

var noneSense = {
  'eng': ['the', 'for', 'a', 'of', 'to', 'from', 'this', 'that', 'have', 'can', 'has', 'she', 'he', 'i', 'her', 'his', 'we', 'our',
    'on', 'at', 'in', 'will', 'is', 'are', 'so', 'an', 'and', 'may', 'might', 'be', 'not', 'shall', "won't", "isn't", "aren't",
    "should", "shouldn't", "don't", "does", "doesn't", "couldn't", "could", "can't", "if", "then", "than", "gmt",
    // extension of days
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",

    // extension of days abr.
    "mon", "tue", "wed", "thu", "fri", "sat", "sun.",

    // extension of months
    "jan", "feb", "mar", "may", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec",

    // add
    "last", "first", "previous", "next", "backward", "forward", "left", "right", "up", "down",
  ]
};

exports.clearNoneSense = function (data, lang) {
  if (!noneSense.hasOwnProperty(lang)) {
    throw new Error("There is no definition for '" + lang + "' language");
  }

  var base = noneSense[lang];
  var lcopy = data.toLowerCase();

  var wc = ['.', ',', '!', ' '];
  for (var x = 0; x < wc.length; x++) {
    for (var y = 0; y < wc.length; y++) {
      var left = wc[x];
      var right = wc[y];

      for (var i = 0, ln = base.length; i < ln; i++) {
        var word = left + base[i] + right;

        var loc = lcopy.indexOf(word);

        while (loc != -1) {
          data = wordCut(data, loc, word.length);
          lcopy = data.toLowerCase();

          loc = lcopy.indexOf(word);
        }
      }
    }
  }

  return data;
};

function WMap() {
  this._total_words = 0;
  this._total_varying = 0;
  this._max_score = 0;
  this._words = {};

  var _this = this;
  this.getTotalWordCount = function () {
    return _this._total_words;
  };

  this.getWordVarietyCount = function () {
    return _this._total_varying;
  };

  this.getWordScore = function (word) {
    if (_this._words.hasOwnProperty(word))
      return _this._words[word];

    return 0;
  };

  this.getTopWords = function (topWhat) {
    var result = {};

    for (var i = _this._max_score; topWhat > 0; i--) {
      var found = false;
      for (var word in _this._words) {
        if (!_this._words.hasOwnProperty(word)) continue;

        var wc = _this._words[word];

        if (wc.vcount != i)
          continue;
        else {
          result[word] = wc;
          found = true;
        }
      }

      if (found) topWhat--;
      if (i == 0) break;
    }

    return result;
  };

  this.calculateTermFrequency = function (K) {
    for (var word in _this._words) {
      if (!_this._words.hasOwnProperty(word)) continue;

      _this._words[word].termFrequency = statistic.dTermFrequency
      (_this._words[word].vcount, _this._max_score, K);
    }

    return _this;
  };
}

var exp = new RegExp("[a-zA-Z]+", "g");
exports.getWordMap = function (data) {
  exp.lastIndex = 0;
  var arr = data.match(exp);

  var vary = 0;
  var df = new WMap();
  var max = 0;
  for (var o = 0, lo = arr.length; o < lo; o++) {
    var word = arr[o].toLowerCase();
    if (word.length < 3) continue;
    if (df._words.hasOwnProperty(word)) {
      df._words[word].vcount++;
    } else {
      df._words[word] = {vcount: 1};
      vary++;
    }

    if (max < df._words[word].vcount) {
      max = df._words[word].vcount;
    }
  }
  df._total_words = arr.length;
  df._total_varying = vary;
  df._max_score = max;

  return df;
};

exports.normalizeByEnding = function (data, letters) {
  if (!(data instanceof WMap)) {
    throw new Error("expects WMap type of data");
  }

  var len = letters.length;
  var removeList = [];
  for (var word in data._words) {
    if (!data._words.hasOwnProperty(word)) continue;
    if (word.length <= len) continue;

    if (word.substr(word.length - (len)) != letters) {
      if (data._words.hasOwnProperty(word + letters)) {
        data._words[word + letters].vcount += data._words[word].vcount;
        if (data._words[word + letters].vcount > data._max_score)
          data._max_score = data._words[word + letters].vcount;
        removeList.push(word);
      }
    }
  }

  for (var i = 0, ln = removeList.length; i < ln; i++) {
    delete data._words[removeList[i]];
    data._total_varying--;
  }

  return data;
};