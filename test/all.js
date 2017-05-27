const ChromeDiff = require('../')
const assert = require('assert')
const fs = require('fs')

describe('compare images', () => {
  let chromeDiff, baseFilePath = `${__dirname}/fixtures/one.png`, newFilePath = `${__dirname}/fixtures/two.png`
  before(async () => {
    chromeDiff = new ChromeDiff()
  })
  after(async (done) => {
    if(chromeDiff.client) {
      chromeDiff.end()
    }
    done()
  })
  describe('compare', function () {
    describe('difference', function () {
      it('without diff file output option, should not generate diff image file', async () => {
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
      });
      it('with diff file output option, should generate diff img file', async () => {
        let result = await chromeDiff.compare({baseFilePath, newFilePath, diffFilePath: `${__dirname}/tmp/diff.png`})
        assert(result.data)
        assert(result.diffImgFilePath)
        let bitmap = fs.readFileSync(result.diffImgFilePath);
        let base64 = new Buffer(bitmap).toString('base64');
        assert.equal(base64, result.imgurl.replace('data:image/png;base64,', ''))
      });
    });
    describe('same', function () {
      it('.', async () => {
        let result = await chromeDiff.compare({baseFilePath, newFilePath: baseFilePath})
        assert.equal(true, result.data.isSameDimensions)
        assert.equal(0, result.data.rawMisMatchPercentage)
        assert.equal(0, result.data.misMatchPercentage)
        assert.deepEqual({"width": 0, "height": 0}, result.data.dimensionDifference)
        assert.deepEqual({"top":260,"left":390,"bottom":0,"right":0}, result.data.diffBounds)
        assert(result.data.analysisTime)
        assert(!result.imgurl)
        assert(!result.diffImgFilePath)
      });
    });
  });
})
