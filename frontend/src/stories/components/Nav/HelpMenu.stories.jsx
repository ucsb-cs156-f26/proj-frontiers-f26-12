import HelpMenu from "main/components/Nav/HelpMenu";
import { Container, Nav, Navbar } from "react-bootstrap";

export default {
  title: "components/Nav/HelpMenu",
  component: HelpMenu,
  parameters: {
    layout: "fullscreen",
  },
};

export const Default = () => (
  <Navbar bg="light" expand="lg" className="p-3">
    <Container>
      <Navbar.Brand>Frontiers</Navbar.Brand>
      <Nav className="ms-auto">
        <HelpMenu />
      </Nav>
    </Container>
  </Navbar>
);

export const DarkNavbar = () => (
  <Navbar bg="dark" variant="dark" expand="lg" className="p-3">
    <Container>
      <Navbar.Brand>Frontiers</Navbar.Brand>
      <Nav className="ms-auto">
        <HelpMenu />
      </Nav>
    </Container>
  </Navbar>
);

export const Standalone = () => (
  <div style={{ padding: "2rem" }}>
    <Nav>
      <HelpMenu />
    </Nav>
  </div>
);
