import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

const lambda = new AWS.Lambda();
const crypto = require('crypto-js');

// Handler function for AWS Lambda
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const requestBody = event.body;
        const parsedBody = JSON.parse(requestBody || '');

        const totalCombinations = Math.pow(parsedBody.characterSet.length, parsedBody.maxPasswordLength);
        const maxConcurrentFunctions = parsedBody.maxConcurrentFunctions;
        const batchSize = Math.ceil(totalCombinations / maxConcurrentFunctions);

        const startTime = new Date().getTime(); // Startzeit erfassen

        const tasks: Promise<string | null>[] = [];

        for (let i = 0; i < maxConcurrentFunctions; i++) {
            tasks.push(divideWorkAndExecute(
                parsedBody.hashAlgorithm,
                parsedBody.password,
                parsedBody.maxPasswordLength,
                parsedBody.characterSet,
                i,
                batchSize
            ));
        }

        const crackedPassword = (await Promise.all(tasks)).find(result => result !== null);


        const endTime = new Date().getTime(); // Endzeit erfassen
        const elapsedTime = endTime - startTime; // Gesamtzeit berechnen

        if (crackedPassword) {
            return {
                statusCode: 200,
                body: `password: ${crackedPassword}, elapsedTime: ${elapsedTime} ms`,
            };
        } else {
            return {
                statusCode: 200,
                body: 'Kein Passwort gefunden (Timeout)',
            };
        }
    } catch (e) {
        return {
            statusCode: 500,
            body: `Fehler beim Aufruf + ${e}`,
        };
    }
};


async function divideWorkAndExecute(
    hashAlgorithm: string,
    password: string,
    maxPasswordLength: number,
    characterSet: string,
    functionIndex: number,
    batchSize: number
): Promise<string | null> {
    const characterArray = characterSet.split('');
    const totalCombinations = Math.pow(characterArray.length, maxPasswordLength);

    const [startIndex, endIndex] = getBatchRange(functionIndex, batchSize, totalCombinations);

    const tasks: Promise<string | null>[] = [];

    for (let length = 1; length <= maxPasswordLength; length++) {
        for (let i = startIndex; i <= endIndex; i++) {
            const combination = generateCombinationFromIndex(i, length, characterArray);
            tasks.push(crackPasswordCombination(combination, hashAlgorithm, password));
        }
    }

    const results = await Promise.all(tasks);

    return results.find(result => result !== null) || null;
}

function generateCombinationFromIndex(index: number, length: number, characterArray: string[]): string {
    let combination = '';
    const base = characterArray.length;

    for (let i = 0; i < length; i++) {
        const remainder = index % base;
        combination = characterArray[remainder] + combination;
        index = Math.floor(index / base);
    }

    return combination;
}

function getBatchRange(batchIndex: number, batchSize: number, totalCombinations: number): [number, number] {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize - 1, totalCombinations - 1);
    return [start, end];
}

async function crackPasswordCombination(combination: string, hashAlgorithm: string, password: string): Promise<string | null> {
    const hashedCombination = await hashPassword(combination, hashAlgorithm);

    if (hashedCombination === password) {
        return combination; // Passwort gefunden
    } else {
        return null; // Passwort nicht gefunden
    }
}
async function hashPassword(password: string, algorithm: string): Promise<string> {
    // Implement the actual SHA-1 hashing algorithm here
    // Placeholder implementation using a library like 'crypto-js'
    return crypto.SHA1(password).toString();
}


