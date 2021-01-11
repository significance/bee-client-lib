const axios = require('axios')
const swarm = require('swarm-lowlevel')
const join = require('./asyncJoiner')
const dfeeds = require('dfeeds')

const textEncoding = require('text-encoding')

function toByteArray(hexString) {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

function toArrayBuffer(buf) {
    if (buf instanceof ArrayBuffer) {
        return buf;
    }
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

const toHex = byteArray => Array.from(byteArray, (byte) => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('')

function BeeClient(host, options) {
    options = options || {}
    this.feeds = {}
    this.chunkDataEndpoint = host + "/chunks"
    this.axios = axios.create({
        baseURL: this.chunkDataEndpoint,
        timeout: options.timeout
    });
}

BeeClient.prototype.mergeUint8Arrays = (arrays) => {
    const size = arrays.reduce((prev, curr) => prev + curr.length, 0)
    const r = new Uint8Array(size)
    let offset = 0
    for (const arr of arrays) {
        r.set(arr, offset)
        offset += arr.length
    }
    return r
}

BeeClient.prototype.uploadData = async function (data) {
    const chunks = []
    const chunkCallback = (chunk) => chunks.push(chunk)
    const splitter = new swarm.fileSplitter(chunkCallback)
    const hash = splitter.split(data)
    for (const chunk of chunks) {
        const reference = toHex(chunk.reference)
        const data = Uint8Array.from([...chunk.span, ...chunk.data])
        await this.uploadChunkData(data, reference)
    }
    return hash
}

BeeClient.prototype.addFeed = async function (wallet, startIndex = 0) {
    //instantiate soc id generator
    const indexedSocIdGen = new dfeeds.indexed(new Uint8Array(20))
    //reset index to 0 for some reason???
    // if (startIndex >= 0) {
    //     indexedSocIdGen.skip(startIndex)
    // }

    this.feeds[wallet.address] = indexedSocIdGen
}

BeeClient.prototype.updateFeed = async function (data, wallet) {
    const indexedSocIdGen = this.feeds[wallet.address]
    const nextId = indexedSocIdGen.next()
    const splitter = new swarm.fileSplitter(undefined, true)
    const chunk = splitter.split(data)
    const soc = new swarm.soc(nextId, chunk, wallet)
    soc.sign()
    const socAddress = soc.getAddress()
    const socData = soc.serializeData()
    const res = await this.uploadChunkData(socData, toHex(socAddress))
    return res
}

BeeClient.prototype.getFeed = async function (wallet) {
    const indexedSocIdGen = this.feeds[wallet.address]
    const thisId = indexedSocIdGen.current()
    const soc = new swarm.soc(thisId, undefined, wallet)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.updateFeedAtIndex = async function (data, wallet, i) {
    const indexedSocIdGen = this.feeds[wallet.address]
    const id = indexedSocIdGen.atIndex(i)
    const splitter = new swarm.fileSplitter(undefined, true)
    const chunk = splitter.split(data)
    const soc = new swarm.soc(id, chunk, wallet)
    soc.sign()
    const socAddress = soc.getAddress()
    const socData = soc.serializeData()
    const res = await this.uploadChunkData(socData, toHex(socAddress))
    return res
}

BeeClient.prototype.getFeedAtIndex = async function (wallet, i) {
    const indexedSocIdGen = this.feeds[wallet.address]
    const thisId = indexedSocIdGen.atIndex(i)
    const soc = new swarm.soc(thisId, undefined, wallet)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.getFeedAtIndexByAddress = async function (address, i) {
    const baddress = toByteArray(address);
    const indexedSocIdGen = this.feeds[baddress]
    const thisId = indexedSocIdGen.atIndex(i)
    const soc = new swarm.soc(thisId, undefined, undefined, baddress)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.addFeedWithSalt = async function (salt, wallet, startIndex = -1) {

    const indexedSaltedSocIdGen = new dfeeds.saltIndexed(wallet.address, salt)
    if (startIndex > -1) {
        indexedSaltedSocIdGen.skip(startIndex+1)
    }
    
    if (this.feeds[salt] == undefined) {
	this.feeds[salt] = {}
    }
    this.feeds[salt][wallet.address] = indexedSaltedSocIdGen
}

BeeClient.prototype.updateFeedWithSalt = async function (salt, data, wallet) {
    if (this.feeds[salt] === undefined || this.feeds[salt][wallet.address] === undefined) {
        this.addFeedWithSalt(salt, wallet)
    }
    const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    const nextId = indexedSaltedSocIdGen.next()
    const splitter = new swarm.fileSplitter(undefined, true)
    const chunk = splitter.split(data)
    const soc = new swarm.soc(nextId, chunk, wallet)
    soc.sign()
    const socAddress = soc.getAddress()
    const socData = soc.serializeData()
    const res = await this.uploadChunkData(socData, toHex(socAddress))
    return res
}

BeeClient.prototype.updateFeedWithSaltAtIndex = async function (salt, data, wallet, i) {
    if (this.feeds[salt] === undefined || this.feeds[salt][wallet.address] === undefined) {
        this.addFeedWithSalt(salt, wallet)
    }
    const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    const id = indexedSaltedSocIdGen.atIndex(i)
    const splitter = new swarm.fileSplitter(undefined, true)
    const chunk = splitter.split(data)
    const soc = new swarm.soc(id, chunk, wallet)
    soc.sign()
    const socAddress = soc.getAddress()
    const socData = soc.serializeData()
    const res = await this.uploadChunkData(socData, toHex(socAddress))
    return res
}

BeeClient.prototype.getFeedWithSalt = async function (salt, wallet) {
    const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    const thisId = indexedSaltedSocIdGen.current()
    const soc = new swarm.soc(thisId, undefined, wallet)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.getFeedWithSaltAtIndex = async function (salt, wallet, i) {
    if(this.feeds[salt] === undefined || this.feeds[salt][wallet.address] === undefined){
        return false;
    }
    const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    const thisId = indexedSaltedSocIdGen.atIndex(i)
    const soc = new swarm.soc(thisId, undefined, wallet)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.getFeedWithSaltAtIndexByAddress = async function (salt, address, i) {
    const baddress = toByteArray(address);
    if(this.feeds[salt] === undefined || this.feeds[salt][baddress] === undefined ){
        return false;
    }
    const indexedSaltedSocIdGen = this.feeds[salt][baddress]
    const thisId = indexedSaltedSocIdGen.atIndex(i)
    const soc = new swarm.soc(thisId, undefined, undefined, undefined, baddress)
    const socAddress = soc.getAddress()
    const rawRes = await this.downloadChunkData(toHex(socAddress))
    const ch = { data: new Uint8Array(rawRes) }
    const res = new swarm.socFromSocChunk(ch)
    return res
}

BeeClient.prototype.getFeedWithSaltAtHighestIndex = async function (salt, wallet, i = 0, address) {
    //start to get incremental from index i until 404 then report highest value
    let res = false
    let done = false
    let baddress
    while(done === false){
        try{
            if(typeof wallet !== 'undefined'){
                res = await this.getFeedWithSaltAtIndex(salt, wallet, i)
                baddress = wallet.address;
            }
            if(typeof address !== 'undefined'){
                res = await this.getFeedWithSaltAtIndexByAddress(salt, address, i)
                baddress = toByteArray(address);
            }
            if(res === false){
                return false
            }
            i += 1
        }catch(e){
            let status = e.message.indexOf('timeout') > -1 ? 0 : e.response.status;
            switch(status){
                case 0 :
                case 404 :
                case 500 :
                    // a chunk either
                    // cannot be found or
                    // does not exist
                    // 500 is included as it seems 
                    // the incorrect error reported from bee
                    done = true;
                    //re-estabish dfeeds index
                    const indexedSaltedSocIdGen = this.feeds[salt][baddress]
                    indexedSaltedSocIdGen.set(i)
                    break;
                default:
                    throw e;
            }       
        }
    }
    return res
}

BeeClient.prototype.getByAddress = async function (address, key, i = -1) {
    //key should be < 32 bytes
    const te = new textEncoding.TextEncoder("utf-8")
    const rawSalt = te.encode(key)
    const uint8 = new Uint8Array(32)
    uint8.set(rawSalt, 0)
    const salt = uint8

    // if no index supplied, work out the highest index, if there is none, set to 0
    // if(i === -1){
    //     const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    //     i = indexedSaltedSocIdGen.current()
    //     i = i === -1 ? 0 : i
    // }

    let res = await this.getFeedWithSaltAtHighestIndex(salt, undefined, 0, address)
    if(res === false){
        return false
    }else{
        const td = new textEncoding.TextDecoder("utf-8")
        const string = td.decode(res.chunk.data)
        return string
    }
}

BeeClient.prototype.get = async function (wallet, key, i = -1) {
    //key should be < 32 bytes
    const te = new textEncoding.TextEncoder("utf-8")
    const rawSalt = te.encode(key)
    const uint8 = new Uint8Array(32)
    uint8.set(rawSalt, 0)
    const salt = uint8

    // if no index supplied, work out the highest index, if there is none, set to 0
    // if(i === -1){
    //     const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    //     i = indexedSaltedSocIdGen.current()
    //     i = i === -1 ? 0 : i
    // }

    let res = await this.getFeedWithSaltAtHighestIndex(salt, wallet)
    if(res === false){
        return false
    }else{
        const td = new textEncoding.TextDecoder("utf-8")
        const string = td.decode(res.chunk.data)
        return string
    }
}

BeeClient.prototype.set = async function (wallet, key, value, i = -1) {
    //key should be < 32 bytes
    const te = new textEncoding.TextEncoder("utf-8")
    const rawSalt = te.encode(key)
    const uint8 = new Uint8Array(32)
    uint8.set(rawSalt, 0)
    const salt = uint8

    //value should be < 4096 bytes
    const data = te.encode(value)

    // if no index supplied, work out the highest index and increment it, if there is none, set to 0
    if(i === -1){
        let res = await this.getFeedWithSaltAtHighestIndex(salt, wallet)
        if(res === false){
            i = 0
        }else{
            // debugger
            const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
            i = indexedSaltedSocIdGen.currentIndex()
            // i = i + 1
        }
    }

    return this.updateFeedWithSaltAtIndex(salt, data, wallet, i)
}

// get
// check to see if feeds is -1
// if it is, search for highest index
// if a highest index is found
//   set the feeds index to be this index
//   return the reference (let fds deal with actual data at this point, since this lib is using chunk level retrieval)

// set
// check to see if feeds is -1
// if it is, search for highest index
// if a highest index is found
//   set the feeds index to be this index
// set the reference (only allow references to be set)



// BeeClient.prototype.getFeedWithSaltAndIncrement = async function (salt, wallet) {
//     const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
//     const thisId = indexedSaltedSocIdGen.current()
//     const soc = new swarm.soc(thisId, undefined, wallet)
//     const socAddress = soc.getAddress()
//     const rawRes = await this.downloadChunkData(toHex(socAddress))
//     const ch = { data: new Uint8Array(rawRes) }
//     const res = new swarm.socFromSocChunk(ch)
//     indexedSaltedSocIdGen.skip(1)
//     return res
// }


BeeClient.prototype.nextFeedIndex = async function (salt, wallet) {
    const indexedSaltedSocIdGen = this.feeds[salt][wallet.address]
    indexedSaltedSocIdGen.next()
}

BeeClient.prototype.uploadChunkData = async function (data, hash) {
    const response = await this.axios({
        headers: {
            'Content-Type': 'binary/octet-stream',
        },
        method: 'post',
        url: hash,
        data: data
    });
    if (!response.status === 200) {
        throw new Error('invalid response: ' + response.statusText)
    }
    return hash
}

BeeClient.prototype.downloadChunkData = async function (hash) {
    const response = await this.axios({
        headers: {
            'Content-Type': 'binary/octet-stream',
        },
        method: 'get',
        url: hash,
        responseType: "arraybuffer"
    })
    const arrayBuffer = toArrayBuffer(response.data)
    return arrayBuffer
}

BeeClient.prototype.downloadChunks = async function (hash) {
    const chunks = []
    const totalSize = await join(hash, this.downloadChunkData.bind(this), data => {
        chunks.push(data)
    })
    return chunks
}

BeeClient.prototype.downloadData = async function (hash) {
    const chunks = await this.downloadChunks(hash)
    const buffers = chunks.map(chunk => chunk.data)
    return this.mergeUint8Arrays(buffers)
}

BeeClient.prototype.testUploadAndDownload = async function () {
    const data = new Uint8Array(4096 * 8 + 1)
    const hash = await this.uploadData(data)
    const buffers = await this.downloadData(hash)
}

module.exports = BeeClient
