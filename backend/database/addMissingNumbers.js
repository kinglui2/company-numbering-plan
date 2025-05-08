const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Default values for unassigned numbers
const defaultUnassigned = {
    Allocation: 'No',
    Golden: 'No',
    'Subscriber Name': '',
    Gateway: 'CS01',
    Company: '',
    'Assignment date': ''
};

async function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const data = new Map();
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim()
            }))
            .on('data', (row) => {
                const number = row.Number?.toString().trim();
                if (number) {
                    data.set(number, {
                        Allocation: row.NumberAssigned === 'Yes' ? 'Yes' : 'No',
                        Golden: row.Golden === 'Yes' ? 'Yes' : 'No',
                        'Subscriber Name': row.SubscriberName || '',
                        Gateway: row.GW || 'CS01',
                        Company: row.SubscriberName || '',
                        'Assignment date': '01.01.2018'  // Default date
                    });
                }
            })
            .on('end', () => resolve(data))
            .on('error', reject);
    });
}

async function addMissingNumbers() {
    try {
        // Read the assigned and unassigned CSV files
        console.log('Reading assigned and unassigned CSV files...');
        const assignedData = await readCsvFile(path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - assigned.csv'));
        
        // List of missing numbers
        const missingNumbers = [
            '254207900000',  // Assigned
            '254207900543',  // Assigned
            '254207900615',  // Unassigned
            '254207900776',  // Unassigned
            '254207900948',  // Unassigned
            '254207902169',  // Unassigned
            '254207903082',  // Unassigned
            '254207903089'   // Unassigned
        ];

        // Get data for each missing number
        const missingData = new Map();
        for (const number of missingNumbers) {
            if (number === '254207900000' || number === '254207900543') {
                // These are assigned numbers
                const data = assignedData.get(number);
                if (data) {
                    missingData.set(number, data);
                    console.log(`Found assigned data for ${number}`);
                } else {
                    // If not found in assigned.csv, add with default assigned values
                    missingData.set(number, {
                        Allocation: 'Yes',
                        Golden: 'No',
                        'Subscriber Name': 'Cloud One',
                        Gateway: 'CS01',
                        Company: 'Cloud One',
                        'Assignment date': '01.01.2018'
                    });
                    console.log(`Using default assigned data for ${number}`);
                }
            } else {
                // These are unassigned numbers
                missingData.set(number, { ...defaultUnassigned });
                console.log(`Using default unassigned data for ${number}`);
            }
        }

        // Read the cleaned CSV file
        console.log('\nReading cleaned CSV file...');
        const csvData = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_cleaned.csv'))
                .pipe(csv())
                .on('data', (data) => {
                    csvData.push(data);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Original records: ${csvData.length}`);

        // Add missing numbers with their correct data
        for (const [number, data] of missingData) {
            csvData.push({
                Number: number,
                ...data
            });
        }

        // Sort by number
        csvData.sort((a, b) => a.Number.localeCompare(b.Number));

        // Create new CSV file
        const newCsvPath = path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_complete.csv');
        const csvWriter = createCsvWriter({
            path: newCsvPath,
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

        await csvWriter.writeRecords(csvData);

        console.log('\nResults:');
        console.log('--------');
        console.log(`Total records after adding missing numbers: ${csvData.length}`);
        console.log(`Added ${missingData.size} missing numbers`);
        
        // Print the added numbers with their details
        console.log('\nAdded numbers:');
        for (const [number, data] of missingData) {
            console.log(`\nNumber: ${number}`);
            console.log(`Status: ${data.Allocation === 'Yes' ? 'Assigned' : 'Unassigned'}`);
            console.log(`Subscriber: ${data['Subscriber Name']}`);
            console.log(`Gateway: ${data.Gateway}`);
            console.log(`Company: ${data.Company}`);
            console.log(`Assignment Date: ${data['Assignment date']}`);
        }

        console.log('\nNew complete CSV file has been created:');
        console.log(newCsvPath);

    } catch (error) {
        console.error('Error adding missing numbers:', error);
        process.exit(1);
    }
}

// Run the script
addMissingNumbers(); 