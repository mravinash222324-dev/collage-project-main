// frontend/src/components/ProjectArchiving.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProjectArchiving: React.FC = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/');
        return;
      }
      
      const response = await axios.get('http://127.0.0.1:8000/projects/all/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects. Make sure you have a Teacher or Admin account.');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleStatusChange = async (projectId: number, status: 'Completed' | 'Archived') => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(`http://127.0.0.1:8000/projects/archive/${projectId}/`, { status }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchProjects(); // Refresh the list
    } catch (err) {
      setError('Failed to update project status. Ensure status transition is valid (e.g., In Progress -> Completed).');
      console.error(err);
    }
  };

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
    if (status === 'In Progress') color = '#DD6B20'; // Orange
    
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

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
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
      <h2 style={headerStyle}>Project Archiving & Management</h2>
      
      <div style={{ marginTop: '30px' }}>
        {projects.length === 0 ? (
          <p style={{ fontSize: '16px', color: '#718096', textAlign: 'center' }}>No approved projects to manage yet.</p>
        ) : (
          <ul style={listContainerStyle}>
            {projects.map((project: any) => (
              <li key={project.id} style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#3182CE' }}>
                        {project.title}
                        <span style={statusBadgeStyle(project.status)}>{project.status.toUpperCase()}</span>
                    </h3>
                    <p style={{ fontSize: '14px', color: '#4A5568' }}>
                        Submitted by: {project.submission.student.username}
                    </p>
                </div>
                
                <p style={{ fontSize: '14px', color: '#4A5568', marginBottom: '15px', wordBreak: 'break-word' }}>
                  {project.abstract}
                </p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {project.status === 'In Progress' && (
                    <button 
                      style={{ ...buttonStyle, backgroundColor: '#38A169', color: 'white' }}
                      onClick={() => handleStatusChange(project.id, 'Completed')}
                    >
                      Mark as Completed
                    </button>
                  )}
                  {project.status === 'Completed' && (
                    <button 
                      style={{ ...buttonStyle, backgroundColor: '#2D3748', color: 'white' }}
                      onClick={() => handleStatusChange(project.id, 'Archived')}
                    >
                      Archive Project
                    </button>
                  )}
                  <p style={{ color: '#718096', fontSize: '14px', alignSelf: 'center' }}>
                      Progress: {project.progress_percentage}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectArchiving;