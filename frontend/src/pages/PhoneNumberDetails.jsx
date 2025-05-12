import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phoneNumberService } from '../services/api';

function PhoneNumberDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [number, setNumber] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [showUnassignForm, setShowUnassignForm] = useState(false);
    const [formData, setFormData] = useState({
        subscriber_name: '',
        company_name: '',
        gateway: '',
        gateway_username: '',
        notes: ''
    });

    useEffect(() => {
        const fetchNumber = async () => {
            try {
                setLoading(true);
                const data = await phoneNumberService.getNumberById(id);
                setNumber(data);
                setError(null);
            } catch (err) {
                setError('Failed to load phone number details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchNumber();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        try {
            await phoneNumberService.assignNumber(id, formData);
            const updatedNumber = await phoneNumberService.getNumberById(id);
            setNumber(updatedNumber);
            setShowAssignForm(false);
            setFormData({
                subscriber_name: '',
                company_name: '',
                gateway: '',
                gateway_username: '',
                notes: ''
            });
        } catch (err) {
            setError('Failed to assign number');
            console.error(err);
        }
    };

    const handleUnassign = async (e) => {
        e.preventDefault();
        try {
            await phoneNumberService.unassignNumber(id, { notes: formData.notes });
            const updatedNumber = await phoneNumberService.getNumberById(id);
            setNumber(updatedNumber);
            setShowUnassignForm(false);
            setFormData(prev => ({ ...prev, notes: '' }));
        } catch (err) {
            setError('Failed to unassign number');
            console.error(err);
        }
    };

    if (loading) {
        return <div className="card">Loading...</div>;
    }

    if (error) {
        return <div className="alert alert-error">{error}</div>;
    }

    if (!number) {
        return <div className="alert alert-error">Phone number not found</div>;
    }

    return (
        <div>
            <div className="card">
                <h2>Phone Number Details</h2>
                <div className="details-grid">
                    <div>
                        <strong>Full Number:</strong> {String(number.full_number).padStart(12, '0')}
                    </div>
                    <div>
                        <strong>Status:</strong>
                        <span className={`badge badge-${number.status}`}>
                            {number.status}
                        </span>
                    </div>
                    <div>
                        <strong>Company:</strong> {number.company_name || '-'}
                    </div>
                    <div>
                        <strong>Subscriber:</strong> {number.subscriber_name || '-'}
                    </div>
                    <div>
                        <strong>Gateway:</strong> {number.gateway || '-'}
                    </div>
                    <div>
                        <strong>Gateway Username:</strong> {number.gateway_username || '-'}
                    </div>
                    {number.status === 'assigned' && (
                        <div>
                            <strong>Assignment Date:</strong> {new Date(number.assignment_date).toLocaleDateString()}
                        </div>
                    )}
                    {number.status === 'cooloff' && (
                        <>
                            <div>
                                <strong>Unassigned Date:</strong> {new Date(number.unassigned_date).toLocaleDateString()}
                            </div>
                            <div>
                                <strong>Previous Company:</strong> {number.previous_company}
                            </div>
                        </>
                    )}
                </div>

                <div className="actions">
                    {number.status !== 'assigned' && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowAssignForm(true)}
                        >
                            Assign Number
                        </button>
                    )}
                    {number.status === 'assigned' && (
                        <button 
                            className="btn btn-danger"
                            onClick={() => setShowUnassignForm(true)}
                        >
                            Unassign Number
                        </button>
                    )}
                </div>
            </div>

            {showAssignForm && (
                <div className="card">
                    <h3>Assign Number</h3>
                    <form onSubmit={handleAssign}>
                        <div className="form-group">
                            <label className="form-label">Subscriber Name</label>
                            <input
                                type="text"
                                name="subscriber_name"
                                className="form-input"
                                value={formData.subscriber_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                className="form-input"
                                value={formData.company_name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gateway</label>
                            <select
                                name="gateway"
                                className="form-input"
                                value={formData.gateway}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Gateway</option>
                                <option value="cs01">CS01</option>
                                <option value="ls02">LS02</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gateway Username</label>
                            <input
                                type="text"
                                name="gateway_username"
                                className="form-input"
                                value={formData.gateway_username}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary">Assign</button>
                            <button 
                                type="button" 
                                className="btn btn-danger"
                                onClick={() => setShowAssignForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showUnassignForm && (
                <div className="card">
                    <h3>Unassign Number</h3>
                    <form onSubmit={handleUnassign}>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                name="notes"
                                className="form-input"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-danger">Unassign</button>
                            <button 
                                type="button" 
                                className="btn btn-primary"
                                onClick={() => setShowUnassignForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default PhoneNumberDetails; 