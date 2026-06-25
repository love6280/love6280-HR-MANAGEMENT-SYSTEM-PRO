import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { apiSlice } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.NODE_ENV !== 'production',
});
