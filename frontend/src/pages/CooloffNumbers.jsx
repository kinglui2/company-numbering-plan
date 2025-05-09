import NumberList from '../components/NumberList';
import { phoneNumberService } from '../services/api';

function CooloffNumbers() {
    const fetchNumbers = async (page, searchTerm, filters) => {
        return phoneNumberService.getCooloffNumbers();
    };

    return (
        <NumberList
            title="Cooloff Numbers"
            fetchNumbers={fetchNumbers}
            showFilters={false}
        />
    );
}

export default CooloffNumbers; 