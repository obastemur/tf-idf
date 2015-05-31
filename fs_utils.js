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

var fs = require('fs');
var pathModule = require('path');

var getFiles = function (path, ext) {
  var arr = new Array();

  if (!fs.existsSync(path)) {
    return arr;
  }

  var dirs = fs.readdirSync(path);
  for (var o in dirs) {
    if (!dirs.hasOwnProperty(o)) continue;

    var file = pathModule.join(path, dirs[o]);
    var stat = fs.statSync(file);

    if (stat.isDirectory())
      arr = arr.concat(getFiles(file, ext));
    else if (pathModule.extname(file) == ext)
      arr.push(file);
  }

  return arr;
};

exports.searchPathForExtension = function (path, ext) {
  if (!path || !path.length || !ext || !ext.length) {
    throw new Error("expects path and ext parameters")
  }

  if ((ext + "").trim()[0] != '.') {
    ext = "." + (ext + "").trim();
  }

  return getFiles(path + "", ext + "");
};