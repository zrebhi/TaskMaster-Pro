import Navbar from './Navbar.jsx';

const Layout = ({ children }) => {
  return (
    // This parent is a vertical flex column that takes up the whole screen
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar is the first item, with a fixed height */}
      <Navbar />

      {/* <main> is the second item, and `flex-1` makes it take all REMAINING vertical space */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default Layout;
