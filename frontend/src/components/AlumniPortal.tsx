// frontend/src/components/AlumniPortal.tsx
import React, { useState, useEffect } from 'react';
import api from '../config/api';


const AlumniPortal: React.FC = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    const fetchProjects = async () => {
        try {
            const response = await api.get('/alumni/my-projects/');
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch projects. Please log in again.');
            setLoading(false);
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // --- Styles ---
    const containerStyle: React.CSSProperties = {
        padding: '40px 20px',
        maxWidth: '900px',
        margin: '0 auto',
    };

    const headerStyle: React.CSSProperties = {
        fontSize: '28px',
        marginBottom: '20px',
        color: '#2D3748',
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
    };

    const listContainerStyle: React.CSSProperties = {
        listStyle: 'none',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    };

    const listItemStyle: React.CSSProperties = {
        padding: '25px',
        border: '1px solid #CBD5E0',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        backgroundColor: 'white',
    };

    const statusBadgeStyle = (status: string): React.CSSProperties => {
        let color = '#718096'; // Gray
        if (status === 'Completed') color = '#38A169'; // Green
        if (status === 'Archived') color = '#2D3748'; // Dark Gray

        return {
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '5px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: color,
            marginLeft: '15px',
        };
    };

    // --- Render Logic ---
    if (loading) {
        return <div style={{ textAlign: 'center', paddingTop: '50px' }}>Loading projects...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', paddingTop: '50px', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>My Completed & Archived Projects (Portfolio)</h2>

            <div style={{ marginTop: '30px' }}>
                {projects.length === 0 ? (
                    <p style={{ fontSize: '16px', color: '#718096', textAlign: 'center' }}>You have not completed any projects yet to display in your portfolio.</p>
                ) : (
                    <ul style={listContainerStyle}>
                        {projects.map((project: any) => (
                            <li key={project.id} style={listItemStyle}>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: '#3182CE' }}>
                                    {project.title}
                                    <span style={statusBadgeStyle(project.status)}>{project.status.toUpperCase()}</span>
                                </h3>
                                <p style={{ fontSize: '14px', color: '#4A5568', marginBottom: '10px', wordBreak: 'break-word' }}>
                                    {project.abstract_text}
                                </p>
                                <p style={{ fontSize: '12px', color: '#718096' }}>Archived on: {new Date(project.submitted_at).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AlumniPortal;