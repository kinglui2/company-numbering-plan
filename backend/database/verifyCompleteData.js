const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function verifyCompleteData() {
    try {
        const targetNumbers = [
            '254207900000',  // Assigned
            '254207900543',  // Assigned
            '254207900615',  // Unassigned
            '254207900776',  // Unassigned
            '254207900948',  // Unassigned
            '254207902169',  // Unassigned
            '254207903082',  // Unassigned
            '254207903089'   // Unassigned
        ];

        console.log('Verifying complete CSV file...\n');
        
        const csvData = new Map();
        await new Promise((resolve, reject) => {
            fs.createReadStream(path.join(__dirname, '../../sheets/New Numbering Plan (PGM) - PLAN_complete.csv'))
                .pipe(csv())
                .on('data', (row) => {
                    const number = row.Number?.toString().trim();
                    if (number) {
                        csvData.set(number, row);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`Total records in file: ${csvData.size}\n`);

        // Verify each target number
        console.log('Verifying target numbers:');
        console.log('-----------------------');
        
        let allCorrect = true;
        for (const number of targetNumbers) {
            const data = csvData.get(number);
            if (!data) {
                console.error(`❌ Number ${number} not found in the complete file!`);
                allCorrect = false;
                continue;
            }

            const isAssigned = number === '254207900000' || number === '254207900543';
            const expectedStatus = isAssigned ? 'Yes' : 'No';
            const expectedSubscriber = isAssigned ? 'Cloud One' : '';
            const expectedGateway = 'CS01';
            const expectedCompany = isAssigned ? 'Cloud One' : '';
            const expectedDate = isAssigned ? '01.01.2018' : '';

            const statusCorrect = data.Allocation === expectedStatus;
            const subscriberCorrect = data['Subscriber Name'] === expectedSubscriber;
            const gatewayCorrect = data.Gateway === expectedGateway;
            const companyCorrect = data.Company === expectedCompany;
            const dateCorrect = data['Assignment date'] === expectedDate;

            console.log(`\nNumber: ${number}`);
            console.log(`Status: ${statusCorrect ? '✅' : '❌'} (Expected: ${expectedStatus}, Got: ${data.Allocation})`);
            console.log(`Subscriber: ${subscriberCorrect ? '✅' : '❌'} (Expected: "${expectedSubscriber}", Got: "${data['Subscriber Name']}")`);
            console.log(`Gateway: ${gatewayCorrect ? '✅' : '❌'} (Expected: ${expectedGateway}, Got: ${data.Gateway})`);
            console.log(`Company: ${companyCorrect ? '✅' : '❌'} (Expected: "${expectedCompany}", Got: "${data.Company}")`);
            console.log(`Assignment Date: ${dateCorrect ? '✅' : '❌'} (Expected: "${expectedDate}", Got: "${data['Assignment date']}")`);

            if (!statusCorrect || !subscriberCorrect || !gatewayCorrect || !companyCorrect || !dateCorrect) {
                allCorrect = false;
            }
        }

        console.log('\nVerification Summary:');
        console.log('-------------------');
        if (allCorrect) {
            console.log('✅ All numbers and their details are correct!');
        } else {
            console.log('❌ Some numbers or details are incorrect. Please review the output above.');
        }

    } catch (error) {
        console.error('Error verifying complete data:', error);
        process.exit(1);
    }
}

// Run the verification
verifyCompleteData(); 