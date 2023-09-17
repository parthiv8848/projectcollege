import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the user profile data from localStorage
    const auth = JSON.parse(localStorage.getItem("user"));
    if (auth) {
      setUserName(auth.name);
      setUserEmail(auth.email);
    } else {
      navigate("/login");
    }
  }, [navigate]);

 

 
  return (
    <div className="profile">
      <h1>Profile</h1>
      <p>Name: {userName}</p>
      <p>Email: {userEmail}</p>

      
    </div>
  );
};

export default Profile;
