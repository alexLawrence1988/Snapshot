const Web3 = require('web3');
const web3ProviderURL = 'https://speedy-nodes-nyc.moralis.io/a2d2861e4ab0de82e844ebcb/avalanche/mainnet';
const timeFrogsContractAddress = '0xA1B46ff2a3394b9460B4004F2e7401DeC7f7A023';
const contractInterface = require('./abi');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-west-2' })
const dynamo = new AWS.DynamoDB.DocumentClient();
const maxSupply = 5002;
const fs = require('fs');


module.exports = {
    async takeSnap(event) {
        console.log('start.')

        let idx = 1;
        const addresses = [];
        const failedIds = [];
        const batchSize = 250;

        while (idx <= maxSupply) {
            try {
                await processToken(idx, addresses);
            } catch (err) {
                failedIds.push(idx);
            }

            idx++
        }

        await writeBatches(batchSize, addresses);
        await writeFailures(failedIds);
        console.log('end.')

        return;
    },
}

const writeFailures = function (failedIds) {
    fs.writeFileSync(`./failedIds.json`, JSON.stringify(failedIds));

}

const writeBatches = async function (batchSize, addresses) {
    let i = 1;
    while (addresses.length > 0) {
        console.log(`Writing batch ${i}`);
        const batch = addresses.splice(0, batchSize);
        fs.writeFileSync(`./batch-${i}.json`, JSON.stringify(batch));
        i += 1;
    }

    return;
}


const processToken = async function (tokenId, addresses) {

    try {
        const owner = await getOwner(tokenId);

        if (addresses.includes(owner)) return;

        addresses.push(owner);

        return;
    }
    catch (err) {
        console.error(err);
    }

}

// get owner of id
const getOwner = async function (frogId) {
    console.log(`Checking owner of ${frogId}`);
    const provider = new Web3.providers.HttpProvider(web3ProviderURL);
    const web3 = new Web3(provider);

    const contractAPI = await new web3.eth.Contract(
        contractInterface,
        timeFrogsContractAddress
    );

    const owner = await contractAPI.methods.ownerOf(frogId).call();
    console.log('owner is', owner);
    return owner;
}
