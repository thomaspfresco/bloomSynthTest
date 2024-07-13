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

  const basicPitch = async (recorderBlob,recordedTempo) => {
    setLoading(true); 

    const formData = new FormData();
    formData.append('file', recorderBlob, 'recording.wav'); // 'file' is the key that Flask will expect

    const token = window.localStorage.getItem("token");

    try {
      const response = await axios.post(window.serverLink+'/basicpitch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          token: token,
          tempo: recordedTempo
        }
      });
      setLoading(false); 
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const generate = async (trackName,loop) => {
    setLoading(true); 

    const token = window.localStorage.getItem("token");

    try {
      const response = await axios.post(window.serverLink+'/generate', loop, {
        params: {
          token: token,
          trackName: trackName
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setLoading(false); 
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating:', error);
    }
  };

  const saveSession = async (session) => {

    const token = window.localStorage.getItem("token");

    try {
      const response = await axios.post(window.serverLink+'/save', session, {
        params: {
          token: token
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const getToken = async () => {
    try {

      const token = window.localStorage.getItem("token");
      let msg;

      if (!token) msg = "New user";
      else msg = token;

      const response = await axios.get(window.serverLink+"/getToken", {
        params: {
          message: msg
        }
      });

      if (response.data.message === "Your session expired") window.localStorage.removeItem("token");
      console.log(response.data);
      window.localStorage.setItem("token", response.data.token);

    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

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
    if (isMobile === false) getToken();
  }, [isMobileDevice]); 

  /*useEffect(() => {
    const handleBeforeUnload = (event) => { saveProject(p5InstanceRef.current.project); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, []);*/
  
  useEffect(() => {

    if (!loading && !p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch(generate,saveSession,setLoading,basicPitch), p5ContainerRef.current);
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