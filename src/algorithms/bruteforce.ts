import { APIGatewayProxyHandler,APIGatewayProxyEvent,APIGatewayProxyResult } from 'aws-lambda';
const crypto = require('crypto-js');

// Handler function for AWS Lambda
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent):Promise<APIGatewayProxyResult> => {

    try {
        const requestBody = event.body;
        const parsedBody = JSON.parse(requestBody || '');
        const hashedPass = crypto.SHA1(parsedBody?.password).toString();

        const startTime = new Date().getTime(); // Startzeit erfassen
        const crackedPassword = await crackPassword(parsedBody?.hashAlgorithm, hashedPass, parsedBody?.maxPasswordLength, parsedBody?.characterSet);
        const endTime = new Date().getTime(); // Endzeit erfassen
        const elapsedTime = endTime - startTime; // Zeitdauer berechnen

        if (crackedPassword) {
            return {
                statusCode:200,
                body: `password: ${crackedPassword},
                       elapsedTime: ${elapsedTime}`,
            };
        } else {
            return {
                statusCode:200,
                body: 'Kein Passwort gefunden (Timeout)'
            }
        }
    }catch (e) {
        return {
            statusCode:500,
            body: `Fehler beim Aufruf + ${e}`
        }
    }


};

// Brute-force password cracking function
export async function crackPassword(hashAlgorithm: string, password: string, maxPasswordLength: number, characterSet: string): Promise<string | null> {
    const characterArray = characterSet.split('');

    for (let length = 1; length <= maxPasswordLength; length++) {
        const combinations = generateCombinations(length, characterArray);
        for (const combination of combinations) {
            if (await crackPasswordCombination(combination, hashAlgorithm, password)) {
                return combination;
            }
        }
    }

    return null;
}

// Function to crack a single password combination
async function crackPasswordCombination(combination: string, hashAlgorithm: string, password: string): Promise<boolean> {
    const hashedCombination = await hashPassword(combination, hashAlgorithm);
    return hashedCombination === password;
}

// Function to generate all possible combinations of a given length
function generateCombinations(length: number, characterArray: string[]): string[] {
    const combinations: string[] = [];
    const base = characterArray.length;

    for (let i = 0; i < Math.pow(base, length); i++) {
        let index = i;
        let combination = '';

        while (index > 0) {
            const remainder = index % base;
            combination = characterArray[remainder] + combination;
            index = Math.floor(index / base);
        }

        while (combination.length < length) {
            combination = characterArray[0] + combination;
        }

        combinations.push(combination);
    }

    return combinations;
}

// Function to hash a password using the specified algorithm (SHA-1)
async function hashPassword(password: string, algorithm: string): Promise<string> {
    // Implement the actual SHA-1 hashing algorithm here
    // Placeholder implementation using a library like 'crypto-js'

    return crypto.SHA1(password).toString();
}
