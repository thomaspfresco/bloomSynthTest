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

  useEffect(() => {
    const startAudioContext = () => { Tone.start(); };
    document.addEventListener('click', startAudioContext, { once: true });
    return () => { document.removeEventListener('click', startAudioContext); };
  }, []);

  /*useEffect(() => {
    const handleBeforeUnload = (event) => { saveProject(p5InstanceRef.current.project); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, []);*/
  
  useEffect(() => {

    if (!p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch(setLoading), p5ContainerRef.current);
    }

  }, []); // Only run this effect when loading changes

  return (
    <div className="canvas">
      <div ref={p5ContainerRef}></div>
      <a id="export"></a>
    </div>
  );

  //{window.localStorage.getItem("token")}
}

export default Compose;