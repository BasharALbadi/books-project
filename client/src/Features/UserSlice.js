import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { UsersData } from "../Exampledata";
import axios from "axios";

import * as ENV from "../config";

//const initialState = { value: [] }; //list of user is an object with empty array as initial value
const initialState = {
  value: UsersData,
  logged: "",
  user: JSON.parse(localStorage.getItem('user')) || null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

//Create the thunk for register
export const registerUser = createAsyncThunk(
  "users/registerUser",
  async (userData) => {
    try {
      const response = await axios.post(`${ENV.SERVER_URL}/registerUser`, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      console.log(response);
      const user = response.data.user;
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.log(error);
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  }
);

//Create the thunk for login
export const login = createAsyncThunk("users/login", async (userData) => {
  try {
    const response = await axios.post(`${ENV.SERVER_URL}/login`, {
      email: userData.email,
      password: userData.password,
    });

    const user = response.data.user;
    // Save user to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    const errorMessage = error.response?.data?.error || "Invalid credentials";
    alert(errorMessage);
    throw new Error(errorMessage);
  }
});

//thunk for logout
export const logout = createAsyncThunk("/users/logout", async () => {
  try {
    // Remove user from localStorage regardless of server response
    localStorage.removeItem('user');
    
    try {
      const response = await axios.post(`${ENV.SERVER_URL}/logout`);
      return response.data;
    } catch (error) {
      // Continue with logout even if the server request fails
      console.log("Server logout failed, but proceeding with local logout");
      return { success: true };
    }
  } catch (error) {
    // Ensure localStorage is cleared even if there's an error
    localStorage.removeItem('user');
    throw new Error("Logout failed");
  }
});

// Thunk for getting a user profile
export const getUserProfile = createAsyncThunk(
  "users/getUserProfile",
  async (userId, { getState }) => {
    try {
      const state = getState();
      const response = await axios.get(`${ENV.SERVER_URL}/user/${userId}`, {
        headers: {
          userid: state.users.user._id,
        },
      });
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get user profile");
    }
  }
);

// Thunk for updating a user profile
export const updateUserProfile = createAsyncThunk(
  "users/updateUserProfile",
  async ({ userId, userData }, { getState }) => {
    try {
      const state = getState();
      const response = await axios.put(
        `${ENV.SERVER_URL}/user/${userId}`,
        userData,
        {
          headers: {
            userid: state.users.user._id,
          },
        }
      );
      return response.data.user;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update profile");
    }
  }
);

// Alias for updateUserProfile for API compatibility
export const updateProfile = updateUserProfile;

export const userSlice = createSlice({
  name: "users", //name of the state
  initialState, // initial value of the state
  reducers: {
    addUser: (state, action) => {
      state.value.push(action.payload); //add the payload to the state
    },
    deleteUser: (state, action) => {
      //create a new array with the value that excludes the user with the email value from the action payload, and assign the new array to the state.
      state.value = state.value.filter((user) => user.email !== action.payload);
    },
    updateUser: (state, action) => {
      state.value.map((user) => {
        //iterate the array and compare the email with the email from the payload;
        if (user.email === action.payload.email) {
          user.name = action.payload.name;
          user.password = action.payload.password;
        }
      });
    },
    // Add reset reducer to clear state
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    // Add a manual logout for cases when we need to force logout
    forceLogout: (state) => {
      localStorage.removeItem('user');
      state.user = null;
      state.isSuccess = false;
    }
  },

  //builder.addCase(action creator(pending, fulfilled, rejected), reducer)

  extraReducers: (builder) => {
    //Asynchronous actions that update the state directly,
    //extrareducer for register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
      })

      //extrareducer for login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.user = null;
      })

      //extrareducer for logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Clear user data or perform additional cleanup if needed
        state.user = null;
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = false;
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails on server, clear local state
        state.user = null;
        state.isLoading = false;
        state.isError = true;
      })

      // Get user profile reducers
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(getUserProfile.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })

      // Update user profile reducers
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user && state.user._id === action.payload._id) {
          state.user = action.payload;
          // Update localStorage with updated user data
          localStorage.setItem('user', JSON.stringify(action.payload));
        }
        state.message = "Profile updated";
      })
      .addCase(updateUserProfile.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      });
  },
});

export const { addUser, deleteUser, updateUser, reset, forceLogout } = userSlice.actions; //export the function

export default userSlice.reducer;
