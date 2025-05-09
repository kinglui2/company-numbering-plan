import { useState, useEffect } from 'react';

function NumberingPlanForm({ plan, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name,
                description: plan.description,
                status: plan.status
            });
        }
    }, [plan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                />
            </div>

            <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                    {plan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default NumberingPlanForm; 