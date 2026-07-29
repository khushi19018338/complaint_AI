import { configureStore } from '@reduxjs/toolkit';
import complaintReducer from './complaintSlice';

const store = configureStore({
  reducer: {
    complaint: complaintReducer,
  },
});

export default store;
