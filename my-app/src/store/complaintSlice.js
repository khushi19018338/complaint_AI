import { createSlice } from '@reduxjs/toolkit';

const initialFormState = {
  complaintSource: '',
  customerName: '',
  productName: '',
  productStrength: '',
  batchNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  quantityAffected: '',
  complaintType: '',
  complaintDate: '',
  detailedDescription: '',
  initialSeverity: '',
  priority: '',
};

const initialState = {
  formState: initialFormState,
  chatHistory: [
    {
      sender: 'assistant',
      text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
    }
  ],
  progress: 0,
  statusMessage: '',
  isExtracting: false,
  isSaving: false,
  isChatting: false,
};

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setFormState: (state, action) => {
      state.formState = { ...state.formState, ...action.payload };
    },
    updateFormFields: (state, action) => {
      state.formState = { ...state.formState, ...action.payload };
    },
    clearForm: (state) => {
      state.formState = initialFormState;
      state.chatHistory = [
        {
          sender: 'assistant',
          text: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.'
        }
      ];
      state.progress = 0;
      state.statusMessage = '';
    },
    addMessage: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    setMessages: (state, action) => {
      state.chatHistory = action.payload;
    },
    setProgress: (state, action) => {
      state.progress = action.payload;
    },
    setStatusMessage: (state, action) => {
      state.statusMessage = action.payload;
    },
    setExtracting: (state, action) => {
      state.isExtracting = action.payload;
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setChatting: (state, action) => {
      state.isChatting = action.payload;
    },
  },
});

export const {
  setFormState,
  updateFormFields,
  clearForm,
  addMessage,
  setMessages,
  setProgress,
  setStatusMessage,
  setExtracting,
  setSaving,
  setChatting,
} = complaintSlice.actions;

export default complaintSlice.reducer;
