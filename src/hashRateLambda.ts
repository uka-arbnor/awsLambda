import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda();
const crypto = require('crypto-js');

// Handler function for AWS Lambda
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const requestBody = event.body;
        const parsedBody = JSON.parse(requestBody || '');

        const numInstances = parsedBody.numInstances; // Anzahl der parallelen Instanzen
        const memorySize = parsedBody.memorySize; // Speicher für die Lambda-Funktionen in MB

        const startTime = new Date().getTime(); // Startzeit erfassen

        const instancePromises: Promise<number>[] = [];

        for (let i = 0; i < numInstances; i++) {
            instancePromises.push(runInstance(memorySize));
        }

        const instanceResults = await Promise.all(instancePromises);

        const totalHashRate = instanceResults.reduce((sum, rate) => sum + rate, 0);

        const endTime = new Date().getTime(); // Endzeit erfassen
        const elapsedTime = endTime - startTime; // Gesamtzeit berechnen

        return {
            statusCode: 200,
            body: `Total Hashrate: ${totalHashRate} hashes/second across ${numInstances} instances, Elapsed Time: ${elapsedTime} ms`,
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: `Fehler beim Aufruf + ${e}`,
        };
    }
};

async function runInstance(memorySize: number): Promise<number> {
    const lambdaFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME; // Get the current Lambda function name

    const lambdaParams = {
        FunctionName: lambdaFunctionName,
        InvocationType: 'Event', // Paralleler Aufruf
        Payload: JSON.stringify({ memorySize }),
        MemorySize: memorySize,
    };

    await lambda.invoke(lambdaParams).promise();

    const numHashes = 1000000; // Anzahl der zu berechnenden Hashes
    const inputData = 'some_input_data'; // Eingabedaten für den Hash-Algorithmus

    const startTime = new Date().getTime(); // Startzeit erfassen

    let hashCount = 0;
    while (true) {
        crypto.createHash('sha1').update(inputData).digest('hex');
        hashCount++;

        const currentTime = new Date().getTime();
        if (currentTime - startTime >= 1000) {
            // Eine Sekunde vergangen, Hashrate berechnen und zurückgeben
            const hashRate = hashCount;
            return hashRate;
        }
    }
}
