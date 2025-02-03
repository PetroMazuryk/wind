import { useRef, useState, useEffect } from 'react';
import styles from './FileUploader.module.css';

const FileUploader = () => {
  const fileInputRef = useRef(null);
  const wsRef = useRef(null);
  const [fileMessage, setFileMessage] = useState('');
  const [fileUrls, setFileUrls] = useState(() => {
    return JSON.parse(localStorage.getItem('uploadedFiles')) || [];
  });

  useEffect(() => {
    let reconnectTimeout;

    function connectWebSocket() {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return; // Якщо WebSocket вже відкритий, не перепідключаємо
      }

      wsRef.current = new WebSocket('ws://localhost:8080');

      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
      };

      wsRef.current.onmessage = (event) => {
        console.log('Message from server:', event.data);

        if (event.data.startsWith('File received and saved as')) {
          let filePath = event.data.split('as ')[1].trim();

          const fullUrl = filePath.startsWith('http')
            ? filePath
            : `http://localhost:8080${filePath}`;

          setFileUrls((prev) => {
            const updatedFiles = [...prev, fullUrl];
            localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
            return updatedFiles;
          });
        }

        setFileMessage(event.data);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3 seconds...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };
    }

    connectWebSocket(); // Перше підключення при завантаженні

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    // Отримуємо список файлів із бекенду
    fetch('http://localhost:8080/api/files')
      .then((response) => response.json())
      .then((data) => {
        setFileUrls(data);
      })
      .catch((error) => console.error('Error fetching files:', error));
  }, []);

  const handleSendFile = () => {
    const file = fileInputRef.current.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        wsRef.current.send(reader.result);
        console.log('File sent:', file.name);
        setFileMessage('Sending file...');
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFileMessage('No file selected');
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
      {fileMessage && <p>{fileMessage}</p>}

      {/* Відображення списку аудіофайлів */}
      {fileUrls.length > 0 && (
        <div>
          <h3>Uploaded Audio Files:</h3>
          {fileUrls.map((url, index) => (
            <audio key={index} controls>
              <source src={url} type="audio/mp3" />
              Ваш браузер не підтримує аудіо елемент.
            </audio>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
