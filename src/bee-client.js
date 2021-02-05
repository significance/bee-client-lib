var Bee = require("@ethersphere/bee-js")

//1 no cache
//2 cache


function BeeClient(host, options) {
    options = options || {}
    this.feeds = {}
    this.beeJS = new Bee.Bee(host)
    return this;
}

String.prototype.lpad = function(padString, length) {
    var str = this;
    while (str.length < length)
        str = padString + str;
    return str;
}

BeeClient.prototype.calculateId = function(topicString, i) {
    let index = this.beeJS.hutils.hexToBytes(i.toString(16).lpad("0", 64))
    let topicHash = this.beeJS.keccak256Hash(topicString).slice(0,20)

    return this.beeJS.keccak256Hash(
        this.beeJS.butils.verifyBytes(20, topicHash),
        this.beeJS.butils.verifyBytes(32, index)
    )
}

BeeClient.prototype.setAtIndex = function(privateKeyBytes, topicString, i, testChunkPayload) {
    console.log("set",topicString, i, testChunkPayload)
    let identifier = this.calculateId(topicString, i);

    let privateKey = this.beeJS.butils.verifyBytes(32, privateKeyBytes)
    let signer = this.beeJS.makeDefaultSigner(privateKey)
    // console.log(signer)
    let socWriter = this.beeJS.makeSOCWriter(signer)
    // console.log(socWriter)
    // console.log(identifier, testChunkPayload)
    return socWriter.upload(this.beeJS.butils.verifyBytes(32,identifier), testChunkPayload)
    // return socWriter.upload(this.beeJS.butils.verifyBytes(32,identifier), testChunkPayload).then(console.log)
}


BeeClient.prototype.getAtIndex = async function(addressBytes, topicString, i) {
    console.log("get",topicString, i)
    let identifier = this.calculateId(topicString, i)
    let socReader = this.beeJS.makeSOCReader(addressBytes)
    let response
    try {
        response = await socReader.download(identifier)
    }catch(e){
        console.log('bc',e.status == 404)
        throw e
    }

    return response.payload()
}



BeeClient.prototype.set = async function (address, privateKey, key, testChunkPayload, i = -1) {
    //privateKey hex string to bytes

    //if == -1, needs to search for highest index and add 1
    if(i === -1) {
        i = await this.getIndex(address, key, i)
        i += 1
    }

    //if > -1 start at that index

    let topicString = key
    let privateKeyBytes = this.beeJS.butils.verifyBytes(32, this.beeJS.hutils.hexToBytes(privateKey))

    let r = await this.setAtIndex(privateKeyBytes, topicString, i, testChunkPayload)
    return r.code == "200"
}


//address = '0x24264f871A3927dB877A1e8E32D7Ba0eEaa1d322';
BeeClient.prototype.get = async function (address, key, i = 0) {

    //if == -1, needs to search for highest index
    //if > -1 start at that index

    let topicString = key
    let addressBytes = this.beeJS.butils.verifyBytes(20, this.beeJS.hutils.hexToBytes(address))

    let res = false
    let done = false
    while(done === false){
        try{
            // if it exists, try the next one
            res = await this.getAtIndex(addressBytes, topicString, i)
            console.log("R",res)
            i += 1
        }catch(e){
            console.log("E",e)
            if(e.status === 404){
                break
            }
            throw e;     
        }
    }
    console.log('x',res)
    return res
}

BeeClient.prototype.getIndex = async function (address, key, i) {

    let topicString = key
    let addressBytes = this.beeJS.butils.verifyBytes(20, this.beeJS.hutils.hexToBytes(address))

    let res = false
    let done = false
    while(done === false){
        try{
            res = await this.getAtIndex(addressBytes, topicString, i)
            i += 1
        }catch(e){
            if(i == -1){
                return 0
            }
            if(e.status === 404){
                break
            }
            throw e;     
        }
    }
    console.log('x',res)
    return i
}


module.exports = BeeClient
