import { Nav, Navbar, NavItem, NavLink } from "reactstrap";
import logo from "../Images/logo-t.png";

import { Link, useNavigate } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";

import { logout } from "../Features/UserSlice";

const Header = () => {
  //const currentlyLogged = useSelector((state) => state.users.logged);
  const currentlyLogged = useSelector((state) => state.users.user.name);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlelogout = async () => {
    dispatch(logout());
    //ensure that the state update from the logout action has been processed before proceeding to the next step.
    await new Promise((resolve) => setTimeout(resolve, 100));

    navigate("/"); //redirect to login page route.
  };

  return (
    <>
      <Navbar className="header">
        <Nav>
          <NavItem>
            <img src={logo} />
          </NavItem>

          <NavItem>
            <Link to="/">Home</Link>
          </NavItem>

          <NavItem>
            <Link to="/profile">Profile</Link>
          </NavItem>

          <NavItem>
            <Link to="/login">Login</Link>
          </NavItem>

          <NavItem>
            <Link onClick={handlelogout}>Logout</Link>
          </NavItem>

          <NavItem>Welcome {currentlyLogged}!</NavItem>
        </Nav>
      </Navbar>
    </>
  );
};

export default Header;
