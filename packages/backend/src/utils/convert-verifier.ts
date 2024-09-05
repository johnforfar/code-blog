// ./packages/backend/src/utils/convert-verifier.ts

function decimalArrayToHex(decimalArray: number[]): string {
    return decimalArray.map(num => num.toString(16).padStart(2, '0')).join('');
}

function run() {
    const input = process.argv[2];
    if (!input) {
        console.error('Please provide the decimal array as a JSON string argument.');
        console.error('Example: npm run convert-verifier "[83,255,243,143,...]"');
        process.exit(1);
    }

    try {
        const decimalArray = JSON.parse(input);
        if (!Array.isArray(decimalArray) || !decimalArray.every(num => typeof num === 'number')) {
            throw new Error('Input must be an array of numbers');
        }

        const hexString = decimalArrayToHex(decimalArray);
        console.log(`STORE_VERIFIER_SECRET=${hexString}`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error parsing input:', error.message);
        } else {
            console.error('An unknown error occurred');
        }
        process.exit(1);
    }
}

run();

export {};