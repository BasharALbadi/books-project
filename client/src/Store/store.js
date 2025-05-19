import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "../Features/UserSlice.js"; //import the reducer
import bookReducer from "../Features/BookSlice";
import transactionReducer from "../Features/TransactionSlice";

import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Uses localStorage by default
import { combineReducers } from "redux";

// Redux Persist config
const persistConfig = {
  key: "reduxstore", // The key to identify the persisted state in storage
  storage, // The storage method (localStorage)
};

const rootReducer = combineReducers({
  users: usersReducer, // Manage users slice of the state
  books: bookReducer, // Manage books slice of the state
  transactions: transactionReducer, // Manage transactions slice of the state
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

/*
export const store = configureStore({
  reducer: {
    users: usersReducer,
    posts: postReducer,
  },
});
*/

const store = configureStore({
  reducer: persistedReducer, // Use the persisted reducer in the store,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For handling non-serializable values in FormData
    }),
});

const persistore = persistStore(store); // Create persistore for rehydration
export { store, persistore };
