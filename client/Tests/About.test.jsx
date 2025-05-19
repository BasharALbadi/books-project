import { describe, it, expect } from "vitest"; // Import necessary testing functions from Vitest
import { render, screen } from "@testing-library/react"; // Import the render and screen function from React Testing Library to render React components in a test environment
import About from "../src/Components/About.jsx"; // Import the About component to be tested
import React from "react"; // Import React to support JSX syntax
import "@testing-library/jest-dom"; //import jest-dom testing library

describe("About", () => {
  it("should render the About component", () => {
    render(<About />); // Render the About component in the virtual DOM provided by the testing library
    //Assertion: check if there is an h1 element
    const aboutElement = screen.getByRole("heading", { level: 1 });
    expect(aboutElement).toBeInTheDocument();

    const aboutElement2 = screen.getByRole("heading", { level: 2 });
    expect(aboutElement2).toBeInTheDocument();

    //const text = screen.queryByText(/about/);
    //expect(text).toBeInTheDocument();
  });

  //Test Case 2
  it("should have the text about", () => {
    render(<About />);
    const text = screen.queryByText(/about/);
    expect(text).toBeInTheDocument();
  });

  //Test Case 3
  it("should have the image", () => {
    render(<About />);
    const image = screen.getByAltText("devimage");
    expect(image).toHaveClass("userImage");
  });
});
