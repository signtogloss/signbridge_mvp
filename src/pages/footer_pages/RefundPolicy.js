import React from 'react';

const RefundPolicy = () => {
    const pageStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    };

    return (
        <div className="container mt-5 mb-5">
            <div style={pageStyle}>
                <h1>Refund Policy</h1>
                <p>This Refund Policy applies to the services provided by Signbridge AI. By using our platform and purchasing credits, you agree to the terms outlined below.</p>

                <h2>1. Non-Refundable Credits</h2>
                <p>In general, credits purchased on Signbridge AI are non-refundable once the transaction is completed.
                    This is because the credits are immediately available for use in our services.
                    If you believe there was an error during the transaction, please contact our support team for review.
                    We recommend users to confirm their needs before making a purchase to avoid unnecessary payment issues.
                    Please note that once credits are purchased, they are considered consumed. This policy is in place to protect platform resources and prevent potential abuse.
                    We reserve the right to further investigate and take action in case of any suspicious transactions or account activities.

                </p>

                <h2>2. Exception: Account Closure</h2>
                <p>If a user requests to close their account, Signbridge AI will refund any unused credits at the Basic Package price.
                    This request must be submitted via email to our customer support team at support@signbridgeai.com.
                    Please note that extra credits earned through promo codes are non-refundable.
                    Before submitting a request for account closure, we encourage users to verify all unused credits and decide whether to continue using the platform or proceed with a refund.
                    While we strive to ensure a smooth and transparent refund process, processing times may vary depending on the complexity of the request.
                    Typically, refunds are processed within 14 days.</p>

                <h2>3. Service Usage</h2>
                <p>Once credits have been used for services (such as rewriting articles), the services are considered delivered, and the credits are non-refundable.
                    We encourage users to review their articles or content carefully before submitting them for rewriting to ensure satisfaction with the final product.
                    Due to the instant and irreversible nature of our services, once the service begins, it cannot be canceled or altered.
                    We strongly recommend that users carefully consider their revision needs before submitting content for modification to ensure the results align with their expectations.</p>

                <h2>4. Contact Us</h2>
                <p>For any questions or refund requests, please email us at support@signbridgeai.com. Our support team will review your request and respond within 5 business days.
                    To ensure faster processing, please provide transaction details, account information, and a description of the issue to help us resolve it as quickly as possible.
                    If your request involves financial matters or complex account issues, processing times may be longer.
                    We are committed to providing efficient and satisfactory service while ensuring the security and fairness of the platform. For refund requests,
                    please have relevant documentation and necessary information ready to help us assist you better.</p>
            </div>

            {/* Add space at the bottom to improve page layout */}
            <div style={{ height: '150px', backgroundColor: 'transparent' }}></div>
        </div>
    );
};

export default RefundPolicy;
