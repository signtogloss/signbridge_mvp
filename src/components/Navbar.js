import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

const Navbar = () => {
  const [userName, setUserName] = useState(sessionStorage.getItem('userName'));
  const [balance, setBalance] = useState(sessionStorage.getItem('balance'));
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const handleStorageChange = () => {
      const loggedIn = sessionStorage.getItem('loggedIn') === 'true';
      if (loggedIn) {
        setUserName(sessionStorage.getItem('userName'));
        setBalance(sessionStorage.getItem('balance'));
      } else {
        setUserName(null);
        setBalance(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('balanceUpdated', handleStorageChange); // 监听余额更新事件

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('balanceUpdated', handleStorageChange); // 清除事件监听
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setUserName(null);
    setBalance(null);
    setShowLogoutModal(false);
    navigate('/');
  };

  const handleShowLogoutModal = () => setShowLogoutModal(true);
  const handleCloseLogoutModal = () => setShowLogoutModal(false);



  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary ripple-effect" data-bs-theme="dark">
      <div className="container-fluid">
        <Link className="navbar-brand float" to="/">Signbridge AI</Link>
        <button className="navbar-toggler hover-lift" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item stagger-1">
              <Link className="nav-link active hover-lift" aria-current="page" to="/AI_detector">AIGC Services</Link>
            </li>
            <li className="nav-item dropdown stagger-2">
              <button className="nav-link dropdown-toggle btn btn-link hover-lift" data-bs-toggle="dropdown" aria-expanded="false">
                Account Records
              </button>
              <ul className="dropdown-menu zoom-in">
                <li><button className="dropdown-item btn btn-link ripple-effect" onClick={() => navigate('/history')}>Detection | Rewrite History</button></li>
                <li><button className="dropdown-item btn btn-link ripple-effect" onClick={() => navigate('/credit_history')}>Recharge | Spend History</button></li>
                <li><Link className="dropdown-item ripple-effect" to="/update_user">Update Account</Link></li>
              </ul>
            </li>
            <li className="nav-item stagger-3">
              <Link className="nav-link hover-lift" to="/recharge">Recharge Credits</Link>
            </li>
            <li className="nav-item stagger-4">
              <Link className="nav-link hover-lift" to="/earn_credits">Earn Credits</Link>
            </li>
          </ul> {/* 关闭 <ul> */}
          {userName ? (
            <>
              <span className="navbar-text ms-3 fade-in-up" style={{ cursor: 'pointer', fontWeight: '500', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                Welcome, {userName}! Your current balance is {balance} credits.
              </span>
              <span className="navbar-text ms-3 hover-lift ripple-effect" style={{ cursor: 'pointer', fontWeight: '500', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '8px', transition: 'all 0.3s ease' }} onClick={handleShowLogoutModal}>
                Logout
              </span>

              <Modal show={showLogoutModal} onHide={handleCloseLogoutModal} centered className="fade-in-up">
                <Modal.Header closeButton style={{ background: 'var(--primary-gradient)', color: 'white' }}>
                  <Modal.Title>Confirm Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body className="zoom-in">
                  <p>Are you sure you want to log out?</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" className="hover-lift ripple-effect" onClick={handleCloseLogoutModal}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="hover-lift ripple-effect" style={{ background: 'var(--primary-gradient)', border: 'none' }} onClick={handleLogout}>
                    Confirm
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          ) : (
            <span className="navbar-text ms-3" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
              Not Logged In, Click to Log In
            </span>
          )}
          <button id="reset-progress-btn" className="btn btn-danger ms-3" onClick={() => navigate('/contact_support')}>
            Contact Support
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
