// components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import {useDocToQrCode} from './DocToQrCode';

const Footer = () => {


  const googleDocUrl = 'https://docs.google.com/document/d/1iSkYJI4JfZ8uzDFLXZUh0YsdBarPsATqRpgn1PM_xQA/export?format=txt';
  const qrCodeUrl = useDocToQrCode(googleDocUrl);

  const footerStyle = {
    background: 'var(--dark-color)',
    color: '#ffffff',
    position: 'relative',  // 确保footer位于文档流底部
    left: '0',
    bottom: '0',
    width: '100%',
    textAlign: 'center',
    paddingTop: '10px',
    paddingBottom: '10px',
    zIndex: '1000', // 确保 footer 不遮挡内容
    boxShadow: '0 -5px 20px rgba(0,0,0,0.1)'
  };

  const linkStyle = {
    color: 'rgba(255,255,255,0.8)',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    padding: '0.3rem 0.5rem',
    borderRadius: '4px',
    display: 'inline-block'
  };

  const hoverStyle = {
    textDecoration: 'underline'
  };

  return (
    <footer style={footerStyle} className="fade-in-up">
      <div className="container py-3">
        <div className="row">
          <div className="col-md-4 mb-3 mb-md-0 fade-in-up stagger-1">
            <h6 className="text-uppercase">Features</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/contact_support" className="hover-lift" style={linkStyle} onMouseEnter={e => { e.target.style.textDecoration = hoverStyle.textDecoration; e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.textDecoration = linkStyle.textDecoration; e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.8)'; }}>Contact Us</Link>
              </li>
            </ul>
          </div>
          <div className="col-md-4 mb-3 fade-in-up stagger-2">
            <h6 className="text-uppercase">XHS QRcode</h6>
            <img src={qrCodeUrl} alt="QR code" className="hover-lift" style={{ width: '100px', height: '100px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s ease'}} />
          </div>
          <div className="col-md-4 mb-3 mb-md-0 fade-in-up stagger-3">
            <h6 className="text-uppercase">Resources</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/refund-policy" className="hover-lift" style={linkStyle} onMouseEnter={e => { e.target.style.textDecoration = hoverStyle.textDecoration; e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.textDecoration = linkStyle.textDecoration; e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.8)'; }}>Refund Policy</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover-lift" style={linkStyle} onMouseEnter={e => { e.target.style.textDecoration = hoverStyle.textDecoration; e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.textDecoration = linkStyle.textDecoration; e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.8)'; }}>Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-use" className="hover-lift" style={linkStyle} onMouseEnter={e => { e.target.style.textDecoration = hoverStyle.textDecoration; e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#fff'; }} onMouseLeave={e => { e.target.style.textDecoration = linkStyle.textDecoration; e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.8)'; }}>Terms of Use</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(90deg, rgba(26,26,46,1) 0%, rgba(40,40,70,1) 100%)', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} className="zoom-in">
        © 2024 Signbridge AI | A state-of-the-art sign language translation tool created by talented engineers.
      </div>
    </footer>
  );
};

export default Footer;
