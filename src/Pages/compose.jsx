import React, { useState, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import '../App.css';

import MobileMsg from '../Components/MobileMsg';
import Loading from '../Components/Loading';
import sketch from '../Compose/compose';
import p5 from 'p5';
import * as Tone from 'tone';

import axios from 'axios';

function Compose() {

  const [dataOla, setDataOla] = useState('');
  const [dataAdeus, setDataAdeus] = useState('');

  const [loading, setLoading] = useState(false); // Initialize loading state to true
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const p5ContainerRef = useRef(null); // Initialize p5ContainerRef
  const p5InstanceRef = useRef(null); // Initialize p5InstanceRef

  const navigate = useNavigate();

  /*const saveProject = (project) => {
    setLoading(true); // Set loading state to true when myFunction is called
    // Simulate a delay with setTimeout for demonstration purpose

    setTimeout(() => {
      console.log("This function is called from p5.js");
      setLoading(false); // Set loading state to false when myFunction is done
    }, 200); // Adjust the delay as needed
  };*/
  
  const loadSession = async () => {
    setLoading(true); 
    try {

      const token = window.localStorage.getItem("token");
      
      const response = await axios.get(window.serverLink+"/load", {
        params: {
          token: token
        }
      });

      setLoading(false);
      return response.data.session;
      
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  useEffect(() => {
    const startAudioContext = () => { Tone.start(); };
    document.addEventListener('click', startAudioContext, { once: true });
    return () => { document.removeEventListener('click', startAudioContext); };
  }, []);

  useEffect(() => {
    setIsMobileDevice(isMobile);
  }, [isMobileDevice]); 

  /*useEffect(() => {
    const handleBeforeUnload = (event) => { saveProject(p5InstanceRef.current.project); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, []);*/
  
  useEffect(() => {

    if (!loading && !p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch(setLoading), p5ContainerRef.current);
    }

  }, []); // Only run this effect when loading changes

  useEffect(() => {
    // Function to handle resizing
    const handleResize = () => {
      if (p5InstanceRef.current) {
        // Update canvas size to match window size
        const { innerWidth, innerHeight } = window;
        p5InstanceRef.current.resizeCanvas(innerWidth, innerHeight);
        // If you have a method for responsiveness, you can call it here
        // For example: p5InstanceRef.current.getResponsive();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  
    // Cleanup function to remove event listener when component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array to run effect only once on mount

  return (
    <div className="canvas">
      <div ref={p5ContainerRef}></div>
      <a id="export"></a>
      {loading ? <Loading /> : null}
      {isMobileDevice ? <MobileMsg /> : null}
    </div>
  );

  //{window.localStorage.getItem("token")}
}

export default Compose;