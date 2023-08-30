const crypto = require('crypto-js');

async function calculateHashRate(numHashes) {
    const inputData = 'some_input_data'; // Eingabedaten für den Hash-Algorithmus

    const startTime = new Date().getTime(); // Startzeit erfassen

    let hashCount = 0;
    while (hashCount < numHashes) {
        crypto.createHash('sha1').update(inputData).digest('hex');
        hashCount++;
    }

    const currentTime = new Date().getTime();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;

    const hashRate = Math.floor(numHashes / elapsedTimeInSeconds);
    return hashRate;
}

// Anzahl der vCPUs oder Threads auf der EC2-Instanz
const numVCPUs = 4; // Beispielwert

// Anzahl der Hashes, die pro vCPU berechnet werden sollen
const numHashesPerVCPU = 1000000; // Beispielwert

// Gesamtzahl der Hashes
const totalNumHashes = numVCPUs * numHashesPerVCPU;

(async () => {
    const hashRates = await Promise.all(
        Array.from({ length: numVCPUs }, () => calculateHashRate(numHashesPerVCPU))
    );

    const totalHashRate = hashRates.reduce((sum, rate) => sum + rate, 0);
    console.log(`Total Hashrate: ${totalHashRate} hashes/second for ${numVCPUs} vCPUs`);
})();
