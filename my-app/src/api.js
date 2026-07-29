import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const extractText = async (text) => {
  const response = await API.post('/api/extract-text', { text });
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await API.post('/api/upload-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const sendChatMessage = async (messages, formState) => {
  const response = await API.post('/api/chat', { messages, form_state: formState });
  return response.data;
};

export const saveComplaint = async (formState) => {
  const response = await API.post('/api/save', { form_state: formState });
  return response.data;
};

export default API;
