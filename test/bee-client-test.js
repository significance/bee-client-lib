const chai = require('chai')
// const spies = require('chai-spies')
// const util = require('util')
// const fs = require('fs')
// const swarm = require('swarm-lowlevel')
// const { toHex } = require('./conversion')

// const textEncoding = require('text-encoding')

// function toHexString(byteArray) {
//   return Array.prototype.map.call(byteArray, function(byte) {
//     return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//   }).join('');
// }

// const td = new textEncoding.TextDecoder("utf-8")
// const te = new textEncoding.TextEncoder("utf-8")

const BeeClient = require('../src/bee-client');
const assert = require('chai').assert

// const readFileAsync = util.promisify(fs.readFile)

// chai.use(spies)

// const wallet = new swarm.unsafeWallet();

// let tempHash = ''
// let fileData = ''

// const userObject = {
//     avatar: "data",
//     username: "Boys Club Berlin",
//     status: "accountCreated"
// }

// const userObject2 = {
//     avatar: "elpha",
//     username: "Big Boys Club Berlin",
//     status: "accountUpdate"
// }

// const userObject3 = {
//     avatar: "flpha",
//     username: "Big Bad Boys Club Berlin",
//     status: "accountUpdate"
// }

// const rawSalt = te.encode("userdata");
// const uint8 = new Uint8Array(32);
// uint8.set(rawSalt, 0)
// const salt = uint8

// const rawSalt2 = te.encode("userdata");
// const uint82 = new Uint8Array(32);
// uint82.set(rawSalt, 0)
// const salt2 = uint82

// const data = te.encode(JSON.stringify(userObject))
// const data2 = te.encode(JSON.stringify(userObject2))
// const data3 = te.encode(JSON.stringify(userObject3))

const bee = new BeeClient("https://bee-gateway.duckdns.org"
    // , { timeout: 1000 }
)

const testId = new Uint8Array([
  179,
  219,
  163,
  139,
  96,
  127,
  105,
  187,
  68,
  183,
  167,
  247,
  40,
  178,
  52,
  74,
  155,
  180,
  169,
  217,
  175,
  181,
  20,
  179,
  192,
  16,
  158,
  113,
  93,
  104,
  39,
  244 ]);
let testChunkPayload = new Uint8Array([1, 3, 3, 7]);
let testTopic = "testTopic";

describe('BeeClient', () => {
    describe('Testing the Lib <3', () => {
        step('generates identifier', () => {
            let id = bee.calculateId(testTopic,0)
            // assert.deepEqual(id, testId)
        })

        step('sets at index', async (done) => {
            let privateKey = bee.beeJS.butils.verifyBytes(32, bee.beeJS.hutils.hexToBytes('0xbb8f94a3dbca9cbac7c96f2580886e4bc83642b4ec8cc66a5510befe393cc069'))
            let r = await bee.setAtIndex(privateKey, testTopic, 2, testChunkPayload)
            assert.equal(r.code, 200)
            done()
        })

        step('gets at index', async (done) => {
            let address = bee.beeJS.butils.verifyBytes(20, bee.beeJS.hutils.hexToBytes('0x24264f871A3927dB877A1e8E32D7Ba0eEaa1d322'))
            let payload = await bee.getAtIndex(address, testTopic, 2)
            console.log('c',payload, testChunkPayload)
            assert.deepEqual(payload, testChunkPayload)
            done()
        })

        step('sets', async (done) => {
            let r = await bee.set('0xbb8f94a3dbca9cbac7c96f2580886e4bc83642b4ec8cc66a5510befe393cc069', testTopic, testChunkPayload, 0)
            assert.equal(r, true)
            done()
        })

        step('gets', async (done) => {
            let payload = bee.get('0x24264f871A3927dB877A1e8E32D7Ba0eEaa1d322', testTopic, 0).then(console.log)
            // console.log('c',payload, testChunkPayload)
            assert.deepEqual(payload, testChunkPayload)
            done()
        })


        // step('stores item', async (done) => {
        //     fileData = await readFileAsync('test/helloworld.txt')
        //     const hash = await bee.uploadData(fileData).then(hash => {
        //         tempHash = toHex(hash)
        //     })
        //     done()
        //     //no assertion?
        // })
        // step('retrieves item', async (done) => {
        //     const newHash = tempHash.startsWith('0x') ? tempHash.slice(2) : tempHash
        //     const res = await bee.downloadData(newHash)
        //     const result = Buffer.from(res)
        //     assert.equal(result.toString(), fileData.toString(), "Stored is not the same as retrieved")
        //     done()
        // })
        // step('creates a feed', async (done) => {
        //     const res = await bee.addFeed(wallet)
        //     const res2 = await bee.updateFeed(data, wallet)
        //     done()
        // })
        // step('reads a feed', async (done) => {
        //     const res = await bee.getFeed(wallet)
        //     const string = td.decode(res.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')
        //     done()
        // })
        // step('updates a feed', async (done) => {
        //     const res = await bee.updateFeed(data2, wallet)
        //     const res2 = await bee.getFeed(wallet)
        //     const string = td.decode(res2.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject2), 'userObject2 is not found')
        //     done()
        // })
        // step('reads a feed entry at specific index', async () => {
        //     const res = await bee.getFeedAtIndex(wallet, 0)
        //     const string = td.decode(res.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')

        //     const res2 = await bee.getFeedAtIndex(wallet, 1)
        //     const string2 = td.decode(res2.chunk.data)
        //     assert.equal(string2, JSON.stringify(userObject2), 'userObject2 is not found')
        // })
        // step('reads a feed entry at specific new client', async (done) => {
        //     const bee2 = new BeeClient("https://bee-gateway.duckdns.org", { timeout: 10000 })
        //     const res = await bee.getFeedAtIndex(wallet, 0)
        //     const string = td.decode(res.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')
        //     done()
        // })
        // step('updates a feed at specific index', async (done) => {
        //     const res = await bee.updateFeedAtIndex(data3, wallet, 99)
        //     const res2 = await bee.getFeedAtIndex(wallet, 99)
        //     const string = td.decode(res2.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject3), 'userObject3 is not found')
        //     done()
        // })
        // step('creates a feed w salt', async (done) => {
        //     const res = await bee.addFeedWithSalt(salt, wallet)
        //     const res2 = await bee.updateFeedWithSalt(salt, data, wallet)
        //     done()
        // })
        // step('reads a feed w salt', async (done) => {
        //     const res = await bee.getFeedWithSalt(salt, wallet)
        //     var string = td.decode(res.chunk.data);
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')
        //     done()
        // })
        // step('updates a feed w salt', async (done) => {
        //     const res = await bee.updateFeedWithSalt(salt, data2, wallet)
        //     const res2 = await bee.getFeedWithSalt(salt, wallet)
        //     var string = td.decode(res2.chunk.data);
        //     assert.equal(string, JSON.stringify(userObject2), 'userObject2 is not found')
        //     done()
        // })
        // step('reads a feed w salt at specific index', async (done) => {
        //     const res = await bee.getFeedWithSaltAtIndex(salt, wallet, 0)
        //     const string = td.decode(res.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')

        //     const res2 = await bee.getFeedWithSaltAtIndex(salt, wallet, 1)
        //     const string2 = td.decode(res2.chunk.data)
        //     assert.equal(string2, JSON.stringify(userObject2), 'userObject2 is not found')
        //     done()
        // })
        // step('updates a feed w salt at specific index', async (done) => {
        //     const res = await bee.updateFeedWithSaltAtIndex(salt2, data, wallet, 999)
        //     const res2 = await bee.getFeedWithSaltAtIndex(salt, wallet, 999)
        //     var string = td.decode(res2.chunk.data);
        //     assert.equal(string, JSON.stringify(userObject), 'userObject is not found')
        //     done()
        // })
        // step('reads a feed w salt at highest available index', async (done) => {
        //     const res = await bee.getFeedWithSaltAtHighestIndex(salt, wallet, 0)
        //     const string = td.decode(res.chunk.data)
        //     assert.equal(string, JSON.stringify(userObject2), 'userObject is not found')
        //     done()
        // })
        // step('sets greatest index', async (done) => {
        //     const res = await bee.set(wallet, 'testkey', 'testvalue')
        //     done()
        // })
        // step('gets greatest index', async (done) => {
        //     const res = await bee.get(wallet, 'testkey')
        //     assert.equal(res, 'testvalue', 'value is not found')
        //     done()
        // })
        // step('sets new greatest index +1', async (done) => {
        //     const res = await bee.set(wallet, 'testkey', 'testvalue2')
        //     done()
        // })
        // step('gets new greatest index +1', async (done) => {
        //     const res = await bee.getByAddress(toHexString(wallet.address), 'testkey')
        //     assert.equal(res, 'testvalue2', 'value is not found')
        //     done()
        // })
        // step('sets new greatest index +2', async (done) => {
        //     const res = await bee.set(wallet, 'testkey', 'testvalue3')
        //     done()
        // })
        // step('gets new greatest index +2', async (done) => {
        //     const res = await bee.get(wallet, 'testkey')
        //     assert.equal(res, 'testvalue3', 'value is not found')
        //     done()
        // })
        // step('gets new greatest index +2 with new context', async (done) => {
        //     const bee2 = new BeeClient("https://bee-gateway.duckdns.org", { timeout: 1000 })
        //     const res = await bee2.get(wallet, 'testkey')
        //     assert.equal(res, 'testvalue3', 'value is not found')
        //     done()
        // })
    })
})
