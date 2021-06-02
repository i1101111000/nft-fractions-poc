const ipfsClient = require('ipfs-http-client');
fs = require('fs');

async function metaDataGeneration() {
    const ipfs = ipfsClient({ host: "ipfs.infura.io", port: 5001, protocol: "https" })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/Eclipse2019.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Total solar eclipse 2019",
            "description": "Solar eclipse as seen from the La Silla European Southern Observatory (ESO) in La Higuera, Coquimbo Region, Chile",
            "author": "@butchcassidy",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/SolarEclipse2017.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Total solar eclipse 2017",
            "description": "The moon partially covers the sun during an eclipse on Aug. 21, 2017, near Redmond, Oregon",
            "author": "@butchcassidy",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/PartialEclipseFromBangladesh.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Partial solar eclipse seen from Dhaka",
            "description": "A partial solar eclipse is seen from Bangladesh in March 2016. Total eclipse followed, briefly blanketing Indonesia in darkness.",
            "author": "@sundancekid",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/PartialEclipseKualaLumpur.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Solar eclipse is seen from Kuala Lumpur",
            "description": "A partial solar eclipse is seen behind a star and crescent symbol above a mosque in Kuala Lumpur, Malaysia, in March 2016.",
            "author": "@sundancekid",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/DangeorousEclipse.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Total eclipse combination from Tokyo",
            "description": "This combination picture shows an annular solar eclipse seen from Tokyo on May 21, 2012",
            "author": "@butchcassidy",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

    fs.readFile('/Users/szabolcs/Documents/Personal/Szakmai/Ethereum/nft-fractions-dex/src/images/EclipseSingapore.png', async function (err, buffer) {
        if (err) throw err
        const ipfsImage = await ipfs.add(buffer);
        const image = "https://gateway.ipfs.io/ipfs/" + ipfsImage.path;
        const metaData = {
            "name": "Eclipse combination from Singapore",
            "description": "TA partial solar eclipse is seen behind passenger capsules of the Singapore Flyer Ferris wheel in March 2016.",
            "author": "@butchcassidy",
            "image": image
        }
        const file = await ipfs.add(Buffer.from(JSON.stringify(metaData)));
        console.log(file.path);
    })

}

metaDataGeneration();