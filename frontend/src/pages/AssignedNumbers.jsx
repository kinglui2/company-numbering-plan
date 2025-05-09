import NumberList from '../components/NumberList';
import { phoneNumberService } from '../services/api';

function AssignedNumbers() {
    const fetchNumbers = async (page, searchTerm, filters) => {
        const response = await phoneNumberService.getAllNumbers(page, 15);
        // Filter to show only assigned numbers
        return {
            ...response,
            numbers: response.numbers.filter(n => n.status === 'assigned')
        };
    };

    return (
        <NumberList
            title="Assigned Numbers"
            fetchNumbers={fetchNumbers}
            showFilters={true}
        />
    );
}

export default AssignedNumbers; 