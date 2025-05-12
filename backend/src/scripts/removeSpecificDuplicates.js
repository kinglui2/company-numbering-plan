const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// List of known duplicate numbers
const duplicateNumbers = [
    '254207900114',
    '254207900330',
    '254207900502',
    '254207900614',
    '254207900696',
    '254207900709',
    '254207901213',
    '254207901955',
    '254207902022',
    '254207902042',
    '254207902168'
];

async function removeSpecificDuplicates() {
    try {
        const csvData = [];
        const duplicates = new Map();
        
        const csvFilePath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN.csv');
        
        console.log('Reading PLAN.csv file...');
        
        // Read and process the CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => {
                    const number = data.Number?.toString().trim();
                    if (number) {
                        const record = {
                            Number: number,
                            Allocation: data.Allocation,
                            Golden: data.Golden,
                            'Subscriber Name': data['Subscriber Name'],
                            Gateway: data.Gateway,
                            Company: data.Company,
                            'Assignment date': data['Assignment date']
                        };
                        
                        // Only track the specified duplicate numbers
                        if (duplicateNumbers.includes(number)) {
                            if (!duplicates.has(number)) {
                                duplicates.set(number, []);
                            }
                            duplicates.get(number).push(record);
                        }
                        
                        csvData.push(record);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log('\nDuplicate Analysis:');
        console.log('------------------');
        
        // Track which numbers have identical duplicates
        const identicalDuplicates = new Set();
        
        // Analyze duplicates
        for (const number of duplicateNumbers) {
            const records = duplicates.get(number);
            if (records && records.length > 1) {
                console.log(`\nNumber ${number}:`);
                console.log(`Found ${records.length} occurrences`);
                
                // Check if records are identical
                const firstRecord = records[0];
                const areIdentical = records.every(record => 
                    record.Allocation === firstRecord.Allocation &&
                    record.Golden === firstRecord.Golden &&
                    record['Subscriber Name'] === firstRecord['Subscriber Name'] &&
                    record.Gateway === firstRecord.Gateway &&
                    record.Company === firstRecord.Company &&
                    record['Assignment date'] === firstRecord['Assignment date']
                );
                
                console.log(`Records are ${areIdentical ? 'identical' : 'different'}`);
                
                if (areIdentical) {
                    identicalDuplicates.add(number);
                } else {
                    console.log('\nDifferences found:');
                    records.forEach((record, index) => {
                        console.log(`\nOccurrence ${index + 1}:`);
                        console.log(`Allocation: ${record.Allocation}`);
                        console.log(`Golden: ${record.Golden}`);
                        console.log(`Subscriber: ${record['Subscriber Name']}`);
                        console.log(`Gateway: ${record.Gateway}`);
                        console.log(`Company: ${record.Company}`);
                        console.log(`Assignment Date: ${record['Assignment date']}`);
                    });
                }
            }
        }

        // Create cleaned data by removing only identical duplicates
        const cleanedData = [];
        const seenNumbers = new Set();
        
        for (const record of csvData) {
            if (duplicateNumbers.includes(record.Number)) {
                if (identicalDuplicates.has(record.Number)) {
                    // Only keep first occurrence of identical duplicates
                    if (!seenNumbers.has(record.Number)) {
                        cleanedData.push(record);
                        seenNumbers.add(record.Number);
                    }
                } else if (record.Number === '254207901955') {
                    // For 254207901955, only keep the second occurrence
                    if (seenNumbers.has(record.Number)) {
                        // This is the second occurrence, keep it
                        cleanedData.push(record);
                    } else {
                        // This is the first occurrence, skip it
                        seenNumbers.add(record.Number);
                    }
                } else {
                    // Keep all other non-identical duplicates
                    cleanedData.push(record);
                }
            } else {
                cleanedData.push(record);
            }
        }

        // Create cleaned CSV file
        const cleanedCsvPath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_cleaned.csv');
        const csvWriter = createCsvWriter({
            path: cleanedCsvPath,
            header: [
                {id: 'Number', title: 'Number'},
                {id: 'Allocation', title: 'Allocation'},
                {id: 'Golden', title: 'Golden'},
                {id: 'Subscriber Name', title: 'Subscriber Name'},
                {id: 'Gateway', title: 'Gateway'},
                {id: 'Company', title: 'Company'},
                {id: 'Assignment date', title: 'Assignment date'}
            ]
        });

        await csvWriter.writeRecords(cleanedData);

        console.log('\nSummary:');
        console.log('--------');
        console.log(`Original records: ${csvData.length}`);
        console.log(`Cleaned records: ${cleanedData.length}`);
        console.log(`Removed identical duplicates: ${csvData.length - cleanedData.length}`);
        console.log(`Numbers with identical duplicates: ${identicalDuplicates.size}`);
        console.log(`Numbers with different duplicates: ${duplicateNumbers.length - identicalDuplicates.size}`);
        console.log('\nCleaned CSV file has been created:');
        console.log(cleanedCsvPath);

    } catch (error) {
        console.error('Error processing duplicates:', error);
        process.exit(1);
    }
}

// Run the script
removeSpecificDuplicates(); 