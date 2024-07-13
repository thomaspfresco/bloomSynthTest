import React, { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';

import MobileMsg from '../Components/MobileMsg';

import axios from 'axios';

function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFiles([...event.target.files]);
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

  const handleSubmit = async () => {

    // Flag to track if any invalid file type is encountered
    let hasInvalidFileType = false;
    const formData = new FormData();

    // Check file types
    for (const file of selectedFiles) {
        if (file.type !== 'audio/wav' && file.type !== 'audio/mpeg') {
            console.log("Invalid file type: ", file.type);
            hasInvalidFileType = true;
            break; // Exit the loop early
        }
        formData.append('files', file);
    }

    // If any invalid file type is encountered, stop the upload process
    if (hasInvalidFileType) return;

    const token = window.localStorage.getItem("token");

    try {
      const response = await axios.post(window.serverLink+'/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          token: token
        }
      });
      console.log(response.data);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  useEffect(() => {
    setIsMobileDevice(isMobile);
    if (isMobile === false) getToken();
  }, [isMobileDevice]); 

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleSubmit}>Upload</button>
      {window.localStorage.getItem("token")}
      {isMobileDevice ? <MobileMsg /> : null}
    </div>
  );
}

export default Upload;