// components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {useDocToQrCode} from './DocToQrCode';

const Footer = () => {
  const { t } = useTranslation();

  const googleDocUrl = 'https://docs.google.com/document/d/1iSkYJI4JfZ8uzDFLXZUh0YsdBarPsATqRpgn1PM_xQA/export?format=txt';
  const qrCodeUrl = useDocToQrCode(googleDocUrl);

  const footerStyle = {
    backgroundColor: '#343a40',
    color: '#ffffff',
    position: 'relative',  // 改为 'relative'，确保footer位于文档流底部
    left: '0',
    bottom: '0',
    width: '100%',
    textAlign: 'center',
    paddingTop: '10px',
    paddingBottom: '10px',
    zIndex: '1000' // 确保 footer 不遮挡内容
  };

  const linkStyle = {
    color: '#ffffff',
    textDecoration: 'none'
  };

  const hoverStyle = {
    textDecoration: 'underline'
  };

  return (
    <footer style={footerStyle}>
      <div className="container py-1">
        <div className="row">
          <div className="col-md-4 mb-2 mb-md-0">
            <h6 className="text-uppercase">{t('Features')}</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/contact_support" style={linkStyle} onMouseEnter={e => e.target.style.textDecoration = hoverStyle.textDecoration} onMouseLeave={e => e.target.style.textDecoration = linkStyle.textDecoration}>{t('Contact_Us')}</Link>
              </li>
            </ul>
          </div>
          <div className="col-md-4 mb-2">
            <h6 className="text-uppercase">{t('XHS_QRcode')}</h6>
            <img src={qrCodeUrl} alt="QR code" style={{ width: '100px', height: '100px'}} />
          </div>
          <div className="col-md-4 mb-2 mb-md-0">
            <h6 className="text-uppercase">{t('Resources')}</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/refund-policy" style={linkStyle} onMouseEnter={e => e.target.style.textDecoration = hoverStyle.textDecoration} onMouseLeave={e => e.target.style.textDecoration = linkStyle.textDecoration}>{t('Refund_Policy')}</Link>
              </li>
              <li>
                <Link to="/privacy-policy" style={linkStyle} onMouseEnter={e => e.target.style.textDecoration = hoverStyle.textDecoration} onMouseLeave={e => e.target.style.textDecoration = linkStyle.textDecoration}>{t('Privacy_Policy')}</Link>
              </li>
              <li>
                <Link to="/terms-of-use" style={linkStyle} onMouseEnter={e => e.target.style.textDecoration = hoverStyle.textDecoration} onMouseLeave={e => e.target.style.textDecoration = linkStyle.textDecoration}>{t('Terms_of_Use')}</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: '#333', padding: '5px 0' }}>
        © 2024 NLPhraser | A state-of-the-art NLP product created by talented engineers.
      </div>
    </footer>
  );
};

export default Footer;
