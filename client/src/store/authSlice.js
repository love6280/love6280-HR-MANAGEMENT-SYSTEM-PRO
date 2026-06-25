import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token') || null;
let user = null;
try {
  user = JSON.parse(localStorage.getItem('user'));
} catch (e) {
  user = null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user,
    token,
    isAuthenticated: !!token,
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      if (user !== undefined) state.user = user;
      if (token !== undefined) {
        state.token = token;
        state.isAuthenticated = true;
        localStorage.setItem('token', token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
