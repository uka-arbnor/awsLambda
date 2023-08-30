import { crackPassword } from './algorithms/bruteforce';

// Funktion, um die Hash-Rate pro Sekunde zu messen
async function measureHashRate(password: string, tries: number) {
    let startTime = Date.now();
    let hashes = 0;

    for (let i = 0; i < tries; i++) {
        await crackPassword("SHA1",password,4,"abcdefghijklmnopqrstuvwxyz");
        hashes++;
    }

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const hashRate = hashes / (elapsedTime / 1000);
    console.log(`Hash-Rate: ${hashRate.toFixed(2)} Hashes pro Sekunde`);
}

// Beispielaufruf zum Messen der Hash-Rate für ein 4-stelliges Passwort mit 1000 Versuchen
const password = '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684'; //"pass"
const tries = 100;
measureHashRate(password, tries);
