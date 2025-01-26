import React, { useRef } from 'react';
import styles from './FileUploader.module.css';

const FileUploader = () => {
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);

  React.useEffect(() => {
    wsRef.current = new WebSocket('ws://localhost:8080');
    wsRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };
    wsRef.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };
    return () => {
      wsRef.current.close();
    };
  }, []);

  const handleSendFile = () => {
    const file = fileInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        wsRef.current.send(reader.result);
        console.log('File sent:', file.name);
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('No file selected');
    }
  };

  return (
    <div className={styles.container}>
      <h1>MP3 File Uploader</h1>
      <input
        type="file"
        accept=".mp3"
        ref={fileInputRef}
        className={styles.input}
      />
      <button onClick={handleSendFile} className={styles.button}>
        Send MP3
      </button>
    </div>
  );
};

export default FileUploader;
