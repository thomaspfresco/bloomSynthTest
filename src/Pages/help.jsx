import React from 'react';
import { useNavigate } from 'react-router-dom';

const Help = () => {

  const navigate = useNavigate();
  
  return (
    <div style={{color:'white'}}>
      <h1>Help Page</h1>
      <p>Welcome to our website! This is the Help page.</p>
    </div>
  );
};

export default Help;