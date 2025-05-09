import NumberList from '../components/NumberList';
import { phoneNumberService } from '../services/api';

function AvailableNumbers() {
    const fetchNumbers = async (page, searchTerm, filters) => {
        return phoneNumberService.getAllNumbers(page, 15, true);
    };

    return (
        <NumberList
            title="Available Numbers"
            fetchNumbers={fetchNumbers}
            showFilters={true}
        />
    );
}

export default AvailableNumbers; 