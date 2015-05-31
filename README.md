##### Project Description
This is a mini PhD project that is intended to investigate some of the data mining methods to identify web page categories. Hoping this practical implementation with Node.JS will help other individuals interested with the methdods given below.

##### Methods
 - Bag Of Words
 - Term Frequency
 - Inverse Document Frequency
 - Importance Factor

##### Acknowledges and Credits

 - This small project is requested by Prof. S. Hoa Nguyen from PJWSTK.
 - I was able to develop this easily thanks to [Node.JS](http://nodejs.org) and it's [contributors](https://github.com/joyent/node/graphs/contributors)
 - I've learned a lot from [Joseph Wilk's blog](http://blog.josephwilk.net/projects/latent-semantic-analysis-in-python.html) on practical usage of the methods given above
 - (JXcore)[http://jxcore.com] is used to run node applications. You can also use [Node.JS](http://nodejs.org) or [IO.JS](https://iojs.org/en/index.html)
 - A very nice reading on data mining is available from [stanford.edu](http://infolab.stanford.edu/~ullman/mmds/book.pdf)
 - I have no expertise in this subject. If you see a mistake, feel free to contribute from Github.

##### Let's Start

We are going to use a pre-made folder of web pages. All the categories are separated from each other.So, it will be easier to collect relevant words or test the selected methods given previously.

The data set is available from [cmu.edu](http://www.cs.cmu.edu/afs/cs.cmu.edu/project/theo-20/www/data/).

 - Download the .gz file
 - untar / gz

The 'ls -l' output on the data root folder is given below;
```
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 course
drwxr-xr-x@ 8 -----  staff  272 Jul 17  1997 department
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 faculty
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 other
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 project
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 staff
drwxr-xr-x@ 7 -----  staff  238 Jul 17  1997 student
```
There is a bunch of HTML and other file types you will see under these folders. For the sake of an easy data mining, I've developed a basic solution that collects the words from all the HTML files and saves them back to their corresponding copies under 'out' folder.

`bin/compile_path.js` is developed to clean up the HTML files and elect commons words given below;
```
[
    'the', 'for', 'a', 'of', 'to', 'from', 'this', 'that', 'have', 'can', 'has', 'she', 'he', 'i', 'her', 'his', 'we', 'our',
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
```

In order to compile the data folder on your side, follow the steps below;

 - Clone or Download this repository from Github
 - Download test data from [cmu.edu](http://www.cs.cmu.edu/afs/cs.cmu.edu/project/theo-20/www/data/)
 - jx bin/compile_path.js <location_of_the_extracted_data>

 <location_of_the_extracted_data> is DOWNLOADS_FOLDER/webkb/course/

The bag of words collection process used for `course` folder produces 11063 unique words. Since no dictionary check is implemented, some of the collected words don't have any useful meaning. (i.e. mime). Besides, there are words spelled incorrectly. (ie. pgoramming)


**Calculating Term Frequency**

Term Frequency (TF) is used for initial word importance calculation. (Rajaraman, A.; Ullman, J. D. (2011). "Data Mining". Mining of Massive Datasets)

TF result is produced by the function given below;
```
dTermFrequency = function(termScore, maxTermScore, K) {
  if (!K) K = 0.5;

  return K + parseFloat(parseFloat(K * termScore) / maxTermScore);
};
```

I didn't particularly smooth the result by adding +1 to maxTermScore since the TF calculation is made from a known set of words. So, prior to TF calculation, the loop given below collected the words from the pre-rendered text files;
```
for (var i= 0, ln = files.length; i < ln; i++) {
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
```

The application calculates TF per each document individually and then finds the average TF among the other documents for that particular word. The implementation keeps K = 0.5 throughout the calculation therefore the result of TF is between 0.5 and 1.0 showing the frequency of a word among the documents.

It was expected to see some common English or technical words have better TF scores. For example it is common to see 'Phone', 'Pages' and 'Links' words among many webpages. Clearly these words do not help to separate webpages from each other. Still TF was very useful to identify relevant common word list for 'course' pages. For example 'homeworks' has a score of 81 among the 564 documents. This result also covers 'homework' (without s).
(See above loop for 's' 'es' and 'ies' corrections)

The TF result for 'homeworks' reference word was **0.7605**

Considering the maximum TF is 1.0 and min is 0.5, the first impression is that 'homeworks' is somehow important to identify the 'course' category.


**Calculating IDF**

Inverse document frequency (IDF) is initially used for eliminating the common English words from the results.
(Rajaraman, A.; Ullman, J. D. (2011). "Data Mining". Mining of Massive Datasets)
```JS
// wd.count represents the number that we saw a particular word among the documents.
wd.inverseDocumentFrequency = -1 * Math.log(wd.count / (1 + documentCount) );
```

I preferred to use a smoother IDF by adding +1 to division. Although it's not needed, (since we know the document count is always a non zero number) I wanted to eliminate (as much as I could) common page words (i.e. Links) receiving 0 for IDF result.

Using the same reference word 'homeworks' IDF was: **1.9423765764740022**

Knowing we have 564 HTML documents under course folder and 81 of them have 'homeworks' inside, having a relatively small IDF is expected. However it also shows that this particular word may not be considered as a common English word that somehow passed through the initial common word cleanup process.

In order to test the accuracy of TF and IDF, I've removed 'the' filter and re-compiled the HTML files. Below result shows the result for 'the' word;
```
  "count": 462,
  "termFrequency": 0.8668203380693043,
  "inverseDocumentFrequency": 0.20126084006470213,
```

'the' is one of the most commonly available words in any sort of English document. As expected, IDF is very small while TF is closer to 1.

**Importance Factor**
This is the moment that we need a function to smooth IDF over TF (vice versa).

"The formal measure of how concentrated into relatively few documents are the occurrences of a given word is called TF.IDF
(Term Frequency times Inverse Document Frequency)" (Rajaraman, A.; Ullman, J. D. (2011). "Data Mining". Mining of Massive Datasets)

Importance Factor (IF) is a combination of TF and IDF which we have calculated previously. (as defined below)
```
wd.importanceFactor = wd.termFrequency * wd.inverseDocumentFrequency;
```

IF results for 'homeworks' and 'the' words;
```
'the'       ->  "importanceFactor": 0.17445698942499727
'homeworks' ->  "importanceFactor": 1.384440040421534
```

Indeed IF results initially work for selected words above. 'homeworks' word should be somehow related to 'course' subject and can be one of our key words to figure out if a particular HTML page is under a 'course' category. 'the' word has a very small importance factor as expected.

However, i.e. 'dec' (the abbr. of 'december') has "importanceFactor": 1.761599378718436, which is totally unrelated to what I was trying to achieve. I've later realized that the compilation process removed only some of the 'dec' abbreviations. Therefore the result for this particular word was mixed.

##### Conclusion

Using TF, IDF, and IF we can 'basically' identify the category of a web page if we have enough documents to collect the proper identifier for that category. The data set I've used may not be enough to identify a non-technical course web page since the maximum importance factor 6.336825731146441 belongs to the word 'cobol'. Actually it makes sense considering the documents belong to 1997 and course pages are all about technical studies.




