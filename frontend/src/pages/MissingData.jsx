import NumberList from '../components/NumberList';
import { phoneNumberService } from '../services/api';

function MissingData() {
    const fetchNumbers = async (page, searchTerm, filters) => {
        const response = await phoneNumberService.getAllNumbers(page, 15);
        // Filter to show numbers with missing data
        return {
            ...response,
            numbers: response.numbers.filter(n => 
                !n.subscriber_name || 
                !n.company_name || 
                !n.gateway || 
                !n.assignment_date
            )
        };
    };

    return (
        <NumberList
            title="Numbers with Missing Data"
            fetchNumbers={fetchNumbers}
            showFilters={true}
        />
    );
}

export default MissingData; 