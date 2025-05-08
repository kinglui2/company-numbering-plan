const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function countNumbers() {
    try {
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_cleaned.csv');
        const numbers = new Set();
        
        console.log('Reading cleaned CSV file...');
        
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    const number = data.Number?.toString().trim();
                    if (number) {
                        numbers.add(number);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log('\nResults:');
        console.log('--------');
        console.log(`Total unique numbers found: ${numbers.size}`);
        
        // Print first 5 numbers as sample
        console.log('\nFirst 5 numbers:');
        Array.from(numbers).slice(0, 5).forEach(number => {
            console.log(number);
        });

    } catch (error) {
        console.error('Error counting numbers:', error);
        process.exit(1);
    }
}

// Run the count
countNumbers(); 