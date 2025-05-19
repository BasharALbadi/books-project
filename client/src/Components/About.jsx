import React from "react"; // Ensure this line is present if necessary
import userImage from "../Images/user.png"; // Import a default user image
const About = () => {
  return (
    <div>
      <h1>about this project</h1>
      <h2>
        <p>This project is developed by: Anthony</p>
      </h2>
      <p>Email: anthony.madlambayan@utas.edu.om</p>
      <img src={userImage} alt="devimage" className="userImage" />
      <button>Contact developer</button>
    </div>
  );
};
export default About;
