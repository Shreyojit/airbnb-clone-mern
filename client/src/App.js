
import {Route, Routes} from "react-router-dom";
import {UserContextProvider} from "./UserContext";
import LoginPage from "./pages/LoginPage";

import ProfilePage from "./pages/ProfilePage.jsx";
import PlacesPage from "./pages/PlacesPage";
import BookingsPage from "./pages/BookingsPage";
import PlacesFormPage from "./pages/PlacesFormPage";


import Layout from "./Layout";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";
import IndexPage from "./pages/IndexPage.jsx";
import PlacePage from "./pages/PlacePage.jsx";
import BookingPage from "./pages/BookingPage.jsx";


// axios.defaults.baseURL = 'http://localhost:4000/api';
axios.defaults.baseURL = 'https://airbnb-clone-mern-9myi.onrender.com/api';
axios.defaults.withCredentials = true;


function App() {
  return (
   
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/account/places" element={<PlacesPage />} />
          <Route path="/account/places/new" element={<PlacesFormPage />} />
          <Route path="/account/places/:id" element={<PlacesFormPage />} />
          <Route path="/account/bookings" element={<BookingsPage />} />
          <Route path="/place/:id" element={<PlacePage />} />
          <Route path="/account/bookings/:id" element={<BookingPage />} />


        </Route>
      </Routes>
    
       </UserContextProvider> 
  )
}

export default App