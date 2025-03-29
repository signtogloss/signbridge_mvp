// pages/footer_pages/PrivacyPolicy.js
import React from 'react';

const PrivacyPolicy = () => {
  const pageStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  };

  return (
    <div className="container mt-5 mb-5">
      <div style={pageStyle}>
        <h1>Privacy Policy</h1>
        <p>Effective Date: 2023-01-01</p>
        <p>This Privacy Policy governs the manner in which NLPhraser collects, uses, maintains and discloses information collected from users (each, a "User") of the https://nlphraser.com website ("Site"). This privacy policy applies to the Site and all products and services offered by NLPhraser.</p>
        
        <h2>Personal Information</h2>
        <p>We may collect personal information from Users in a variety of ways, including, but not limited to, when Users visit our site, fill out a form, and in connection with other activities, services, features or resources that we make available on our Site. Users may be asked for, as appropriate, their name, email address, phone number, address, payment information, and other information that we may deem desirable to collect for the purposes of delivering or enhancing our Site or services. Users may, however, visit our Site without providing this information. We will collect personal information from Users only if they voluntarily submit such information to us. Users can always refuse to supply personal information, except that it may prevent them from engaging in certain Site-related activities, and they will be unable to enroll in the service that we provide.</p>
        <p>We use the most advanced encryption technology, providing higher security than traditional methods and far surpassing international security standards. Signbridge AI ensures that user data cannot be cracked or leaked during transmission and processing through highly complex encryption techniques. Additionally, we strictly follow privacy protection protocols, automatically deleting all uploaded content after processing, offering truly "no-trace" data handling to fully protect your privacy.</p>

        <h2>Non-Personal Information</h2>
        <p>We may collect non-personal information about Users whenever they interact with our Site. Non-personal information may include the browser name, the type of computer, IP address, operating system, Internet Service Provider, and other technical information about Users' means of visiting our Site.</p>

        <h2>Web Browser Cookies</h2>
        <p>Our Site may use "cookies" to enhance Users' experiences. Users' web browsers place cookies on their hard drives in order to allow us to distinguish user accounts for security and privacy reasons, and to conduct marketing campaigns that we think may interest certain Users. For these reasons, enabling cookies is mandatory for full functionality of our Site and service.</p>

        <h2>How We Use Collected Information</h2>
        <p>NLPhraser collects and uses Users' personal information for the following purposes:</p>
        <ul>
          <li><strong>Personalize user experience:</strong> We may utilize the information we collect to personalize and enhance your experience on our Site. This includes understanding how our Users as a group use the services and resources provided on our Site, allowing us to tailor content and features to meet your specific needs.</li>
          <li><strong>Improve our Site:</strong> We are committed to constantly improving our website offerings. The information and feedback we receive from you help us identify areas for improvement, optimize our existing services, and develop new features and functionalities to better serve you.</li>
          <li><strong>Communication via email:</strong> The email addresses provided by Users will solely be used to respond to your inquiries, requests, or questions. We may also use your email address to send you periodic updates, newsletters, or other relevant information related to our services, but only if you have explicitly opted to receive such communications.</li>
        </ul>

        <h2>How We Protect Your Information</h2>
        <p>We use cutting-edge encryption technology to not only ensure the security of your data transmission but also to fully respect your privacy. Signbridge AI adheres to the principle of "forgetting is protection," meaning that any content uploaded by users is automatically deleted after processing. We do not store or remember any user data. Whether it's your documents, information, or interactions, everything is deleted after completion, ensuring a truly "no-trace" experience that keeps your privacy safe.</p>
        <p>Our Site is in compliance with PCI vulnerability standards in order to create as secure of an environment as possible for Users.</p>

        <h2>Sharing Your Personal Information</h2>
        <p>We do not sell, trade, or rent Users' personal information to others. We may share generic aggregated demographic information not linked to any personal information regarding visitors and users with our business partners, trusted affiliates and advertisers for the purposes outlined above and for any other purpose we deem desirable for our business operations or our Users.</p>

        <h2>Third Party Websites</h2>
        <p>Users may find advertising or other content on our Site that links to the sites and services of our partners, suppliers, advertisers, sponsors, licensors and other third parties. We do not control the content or links that appear on these sites and are not responsible for the practices employed by websites linked to or from our Site. In addition, these sites or services, including their content and links, may be constantly changing. These sites and services may have their own privacy policies and customer service policies. Browsing and interaction on any other website, including websites which have a link to our Site, is subject to that website's own terms and policies. We recommend that you review those websites' Terms of Service and Privacy Policy, or analogous documents, so that you understand your rights in relation to your use of those websites.</p>

        <h2>Compliance With Children's Online Privacy Protection Act</h2>
        <p>Protecting the privacy of children is of utmost importance to us. Therefore, we have implemented measures to ensure that we do not collect or maintain information from individuals under the age of 13. Our website is not designed to attract anyone under 13 years of age.</p>
        <p>If you become aware of a user who is under the age of 13, we kindly request that you contact us immediately with full details. Upon receiving such a report, we will promptly investigate the matter. If we determine that the report has merit and the user is indeed under 13 years of age, we will take appropriate action, which may include discontinuing the provision of our services to the individual.</p>
        <p>We also acknowledge that the collection of personal information from children under 16 years of age, in compliance with the General Data Protection Regulation (GDPR), requires explicit consent from a parent or legal guardian. In the event that we inadvertently collect personal information from a child under 16 without appropriate consent, we will take prompt steps to delete such information from our records.</p>
        <p>We encourage parents or legal guardians to take an active role in monitoring their children’s online activities and to contact us if they believe their child has provided personal information to us without their consent. We will promptly remove any personal information related to a child under 16 from our databases upon receiving a verifiable request from a parent or legal guardian.</p>
        <p>By implementing these measures, we aim to provide a safe and secure online environment for all users, especially children.</p>

        <h2>Changes To This Privacy Policy</h2>
        <p>NLPhraser has the discretion to update this privacy policy at any time. When we do, we will revise the updated date at the bottom of this page. We encourage Users to frequently check this page for any changes to stay informed about how we are helping to protect the personal information we collect. You acknowledge and agree that it is your responsibility to review this privacy policy each time that you visit our website or use our service, and remain aware of any amendments.</p>

        <h2>Your Acceptance Of These Terms</h2>
        <p>By using this Site, you signify your acceptance of this policy and terms of service. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy means that you accept those changes.</p>

        <h2>Contacting Us</h2>
        <p>If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at support@nlphraser.com.</p>
      </div>

      {/* 添加一个透明的空容器以增加页面底部空间 */}
      <div style={{ height: '150px', backgroundColor: 'transparent' }}></div>
    </div>
  );
};

export default PrivacyPolicy;