import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {



  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary ripple-effect" data-bs-theme="dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Signbridge AI</Link>
        <button className="navbar-toggler hover-lift" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active hover-lift" aria-current="page" to="/">ASL bidirectional translation</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link hover-lift" to="/Other">Other</Link>
            </li>
          </ul> {/* 关闭 <ul> */}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
