// pages/footer_pages/TermsOfUse.js
import React from 'react';

const TermsOfUse = () => {
  const pageStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  return (
    <div className="container mt-5 mb-5">
      <div style={pageStyle}>
        <h1>Terms of Use</h1>
        <p>These terms of use (“Terms”) are a legal agreement between you (“You” or “User”) and NLPhraser (“We,” “Us”, or “Our”) governing your access to and use of the Services.</p>
        <p>By accessing or using the Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms or our Privacy Policy, you may not use the Services.</p>
        <h2>Services</h2>
        <p>Our product uses artificial intelligence to improve research papers using machine learning techniques. By providing your paper or document to our AI tool, you agree that it may be processed by the tool and any resulting output may be provided back to you.</p>
        <h2>Personal Data</h2>
        <p>We are committed to protecting Your personal data in accordance with applicable regulations including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). We will only process any personal data You provide to Us in accordance with our Privacy Policy.</p>
        <h2>Acceptable Use</h2>
        <p>You agree to use the Services only for lawful purposes and in accordance with these Terms. You shall not:</p>
        <ul>
          <li>reproduce, distribute, modify, adapt, create derivative works of, publicly display, publicly perform, republish, download, store or transmit any of the material on our Services;</li>
          <li>use the Services in any way that violates any applicable federal, state, local, or international law or regulation;</li>
          <li>engage in any conduct that restricts or inhibits anyone’s use or enjoyment of the Services, or which, as determined by us, may harm NLPhraser or users of the Services or expose them to liability;</li>
          <li>use the Services in any manner that could disable, overburden, damage, or impair the Services or interfere with any other party’s use of the Services.</li>
        </ul>
        <h2>Disclaimer of Warranties</h2>
        <p>The Services are provided “as is” and “as available” without warranties of any kind, either express or implied.</p>
        <h2>Limitation of Liability</h2>
        <p>In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages (including without limitation, damages for loss of data or profit, or due to business interruption) arising out of or in connection with your use of the Services, whether based on breach of contract, tort (including negligence), or any other legal theory.</p>
        <h2>Modifications</h2>
        <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days notice prior to any new terms taking effect. Your continued use of the Services after such notice constitutes your acceptance of the new Terms.</p>
        <h2>Termination</h2>
        <p>We may terminate or suspend your access to all or any part of the Services at any time, without notice or liability, if you breach any of these Terms.</p>
        <h2>Governing Law</h2>
        <p>These Terms and your use of the Services shall be governed by the laws of the state of [Your State or Country] without regard to its conflict of law provisions.</p>
        <h2>Entire Agreement</h2>
        <p>These Terms and our Privacy Policy constitute the entire agreement between you and us with respect to the Services, and supersede all prior or contemporaneous communications and proposals, whether oral or written, between you and us.</p>
        <h2>Contact Us</h2>
        <p>If you have any questions about these Terms or the Services, please contact us at support@nlphraser.com.</p>
        
      </div>

      {/* 添加一个透明的空容器以增加页面底部空间 */}
      <div style={{ height: '150px', backgroundColor: 'transparent' }}></div>
    </div>
  );
};

export default TermsOfUse;