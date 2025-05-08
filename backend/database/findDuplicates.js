const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function findDuplicates() {
    try {
        const csvData = [];
        const numberMap = new Map();
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
                        // Store the full record
                        const record = {
                            Number: number,
                            Allocation: data.Allocation,
                            Golden: data.Golden,
                            'Subscriber Name': data['Subscriber Name'],
                            Gateway: data.Gateway,
                            Company: data.Company,
                            'Assignment date': data['Assignment date']
                        };
                        
                        csvData.push(record);
                        
                        // Track duplicates
                        if (numberMap.has(number)) {
                            if (!duplicates.has(number)) {
                                duplicates.set(number, [numberMap.get(number)]);
                            }
                            duplicates.get(number).push(record);
                        } else {
                            numberMap.set(number, record);
                        }
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log('\nAnalysis Results:');
        console.log('----------------');
        console.log(`Total records in PLAN.csv: ${csvData.length}`);
        console.log(`Unique numbers: ${numberMap.size}`);
        console.log(`Number of duplicated numbers: ${duplicates.size}`);
        
        if (duplicates.size > 0) {
            console.log('\nDuplicate Numbers Details:');
            console.log('------------------------');
            
            for (const [number, records] of duplicates) {
                console.log(`\nNumber ${number} appears ${records.length} times:`);
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

            // Create a cleaned CSV without duplicates
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

            // Use only unique records
            const uniqueRecords = Array.from(numberMap.values());
            await csvWriter.writeRecords(uniqueRecords);

            console.log('\nCleaned CSV file has been created:');
            console.log(cleanedCsvPath);
            console.log(`Total records in cleaned file: ${uniqueRecords.length}`);
        }

    } catch (error) {
        console.error('Error analyzing duplicates:', error);
        process.exit(1);
    }
}

// Run the analysis
findDuplicates(); 