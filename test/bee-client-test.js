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

const bee = new BeeClient("http://localhost:1633"
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
let testChunkPayload2 = new Uint8Array([1, 3, 3, 3, 7]);
let testChunkPayload3 = new Uint8Array([1, 3, 3, 3, 7]);
let testChunkPayload4 = new Uint8Array([1, 3, 3, 3, 3, 7]);
let testChunkPayload5 = new Uint8Array([1, 3, 3, 3, 3, 3, 7]);

let testHexChunkPayload5 = "13333337";


let testTopic = "testTopic" + Date.now();
let privateKeyHex = "0xbb8f94a3dbca9cbac7c96f2580886e4bc83642b4ec8cc66a5510befe393cc069";
let addressHex = "0x24264f871A3927dB877A1e8E32D7Ba0eEaa1d322";

describe('BeeClient', () => {
    describe('Testing the Lib <3', () => {
        step('generates identifier', () => {
            let id = bee.calculateId(testTopic,0)
            // assert.deepEqual(id, testId)
        })

        step('sets at index', async (done) => {
            let privateKey = bee.beeJS.butils.verifyBytes(32, bee.beeJS.hutils.hexToBytes(privateKeyHex))
            let r = await bee.setAtIndex(privateKey, testTopic, 12334, testChunkPayload)
            assert.equal(r.reference.length, 64)
            done()
        })

        step('gets at index', async (done) => {
            let address = bee.beeJS.butils.verifyBytes(20, bee.beeJS.hutils.hexToBytes(addressHex))
            let payload = await bee.getAtIndex(address, testTopic, 12334)
            assert.deepEqual(payload, testChunkPayload)
            done()
        })

        step('sets', async (done) => {
            let r = await bee.setB(addressHex, privateKeyHex, testTopic, testChunkPayload2, 0)
            assert.equal(r.length, 64)
            done()
        })

        step('gets', async (done) => {
            let payload = await bee.getB(addressHex, testTopic, 0)
            assert.deepEqual(payload, testChunkPayload2)
            done()
        })

        step('sets greatest index 2', async (done) => {
            const res = await bee.setB(addressHex, privateKeyHex, testTopic, testChunkPayload3)
            done()
        })

        step('gets greatest index 2', async (done) => {
            let payload = await bee.getB(addressHex, testTopic)
            assert.deepEqual(payload, testChunkPayload3)
            done()
        })

        step('sets greatest index 3', async (done) => {
            const res = await bee.setB(addressHex, privateKeyHex, testTopic, testChunkPayload4)
            done()
        })

        step('gets greatest index 3', async (done) => {
            let payload = await bee.getB(addressHex, testTopic)
            assert.deepEqual(payload, testChunkPayload4)
            done()
        })

        step('sets greatest index 4', async (done) => {
            const res = await bee.setB(addressHex, privateKeyHex, testTopic, testChunkPayload5)
            done()
        })

        step('gets greatest index 4 with new context', async (done) => {
            const bee2 = new BeeClient("http://localhost:1633"
                // , { timeout: 1000 }
            )
            let payload = await bee2.getB(addressHex, testTopic)
            assert.deepEqual(payload, testChunkPayload5)
            done()
        })

        step('sets hex greatest index 5 with new context', async (done) => {
            const bee2 = new BeeClient("http://localhost:1633"
                // , { timeout: 1000 }
            )
            const res = await bee2.set(addressHex, privateKeyHex, testTopic, testHexChunkPayload5)
            done()
        })

        step('gets hex greatest index 5 with new context', async (done) => {
            const bee3 = new BeeClient("http://localhost:1633"
                // , { timeout: 1000 }
            )
            let payload = await bee3.get(addressHex, testTopic)
            assert.deepEqual(payload, testHexChunkPayload5)
            done()
        })
    })
})
