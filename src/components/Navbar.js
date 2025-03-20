import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const [userName, setUserName] = useState(sessionStorage.getItem('userName'));
  const [balance, setBalance] = useState(sessionStorage.getItem('balance'));
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary" data-bs-theme="dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">NLPhraser</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/AI_detector">{t('ai_rate_services')}</Link>
            </li>
            <li className="nav-item dropdown">
              <button className="nav-link dropdown-toggle btn btn-link" data-bs-toggle="dropdown" aria-expanded="false">
                {t('account_records')}
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item btn btn-link" onClick={() => navigate('/history')}>{t('detection_rewrite_history')}</button></li>
                <li><button className="dropdown-item btn btn-link" onClick={() => navigate('/credit_history')}>{t('recharge_spend_history')}</button></li>
                <li><Link className="dropdown-item" to="/update_user">{t('update_account')}</Link></li>
              </ul>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/recharge">{t('recharge_credits')}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/earn_credits">{t('earn_credits')}</Link>
            </li>
          </ul> {/* 关闭 <ul> */}
          {userName ? (
            <>
              <span className="navbar-text ms-3" style={{ cursor: 'pointer' }}>
                {t('welcome_user', { userName, balance })}
              </span>
              <span className="navbar-text ms-3" style={{ cursor: 'pointer' }} onClick={handleShowLogoutModal}>
                {t('logout')}
              </span>

              <Modal show={showLogoutModal} onHide={handleCloseLogoutModal} centered>
                <Modal.Header closeButton>
                  <Modal.Title>{t('confirm_logout')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <p>{t('logout_prompt')}</p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseLogoutModal}>
                    {t('cancel')}
                  </Button>
                  <Button variant="primary" onClick={handleLogout}>
                    {t('confirm')}
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          ) : (
            <span className="navbar-text ms-3" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
              {t('not_logged_in')}
            </span>
          )}
          <button id="reset-progress-btn" className="btn btn-danger ms-3" onClick={() => navigate('/contact_support')}>
            {t('contact_support')}
          </button>

          <Dropdown className="ms-3">
            <Dropdown.Toggle variant="secondary" id="dropdown-language">
              Language | 语言
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => changeLanguage('en')}>English</Dropdown.Item>
              <Dropdown.Item onClick={() => changeLanguage('zh')}>中文</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
