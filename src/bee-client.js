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



BeeClient.prototype.set = async function (privateKey, key, testChunkPayload, i = -1) {
    //privateKey hex string to bytes

    //if == -1, needs to search for highest index
    //if > -1 start at that index
    
    let topicString = key
    let privateKeyBytes = this.beeJS.butils.verifyBytes(32, this.beeJS.hutils.hexToBytes(privateKey))
    console.log(privateKeyBytes)
    let r = await this.setAtIndex(privateKeyBytes, topicString, i, testChunkPayload)
    return r.code == "200"
}


//address = '0x24264f871A3927dB877A1e8E32D7Ba0eEaa1d322';
BeeClient.prototype.get = async function (address, key, i = -1) {

    //if == -1, needs to search for highest index
    //if > -1 start at that index

    //address hex string to bytes
    console.log('test',address)

    let topicString = key
    let addressBytes = this.beeJS.butils.verifyBytes(20, this.beeJS.hutils.hexToBytes(address))
    console.log('test',addressBytes)
    let res = false
    let done = false
    while(done === false){
        try{
            console.log(addressBytes, topicString, i)
            res = await this.getAtIndex(addressBytes, topicString, i)
            console.log(res)
            i += 1
        }catch(e){
            if(e.status === 404){
                break
            }
            throw e
            // switch(e){
            //     // case 0 :
            //     // case 404 :
            //     // case 500 :
            //     //     // a chunk either
            //     //     // cannot be found or
            //     //     // does not exist
            //     //     // 500 is included as it seems 
            //     //     // the incorrect error reported from bee
            //     //     done = true;
            //     //     //re-estabish dfeeds index
            //     //     const indexedSaltedSocIdGen = this.feeds[salt][baddress]
            //     //     indexedSaltedSocIdGen.set(i)
            //     //     break
            //     default:
            //         throw e
            // }       
        }
    }
    return res
}


module.exports = BeeClient
