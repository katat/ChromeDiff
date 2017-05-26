## ChromeDiff

A node.js visual regression test library, compare images by using headless Chrome and resemble.js

### Install
```bash
npm install chromediff
```

### Usages
Please see tests

### Example
```javascript
let chromeDiff = new ChromeDiff()
await chromeDiff.init()
let result = await chromeDiff.compare({baseFilePath, newFilePath})
assert.equal(false, result.data.isSameDimensions)
assert.equal(13.515779092702171, result.data.rawMisMatchPercentage)
assert.equal(13.52, result.data.misMatchPercentage)
assert.deepEqual({"width": 1, "height": 1}, result.data.dimensionDifference)
assert.deepEqual({"top":0,"left":0,"bottom":259,"right":389}, result.data.diffBounds)
assert(result.data.analysisTime)
assert(!result.diffImgFilePath)
var bitmap = fs.readFileSync(__dirname + '/fixtures/diff.png');
let base64 = new Buffer(bitmap).toString('base64');
assert.equal(base64, result.imgurl.replace('data:image/png;base64,', ''))
```

#### License
MIT
