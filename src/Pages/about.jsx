import React from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {

  const navigate = useNavigate();
  
  return (
    <div style={{color:'white'}}>
      <h1>About Page</h1>
      <p>Welcome to our website! This is the About page.</p>
    </div>
  );
};

export default About;