import React from 'react';

const Privacy = () => {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#2c3e50',
          borderBottom: '3px solid #3498db',
          paddingBottom: '10px'
        }}>Privacy Policy - Fillux</h1>
        
        <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
          Last updated: April 3, 2026
        </p>
        
        <h2 style={{ color: '#34495e', marginTop: '30px' }}>1. Information We Collect</h2>
        <p>Fillux is designed with privacy in mind. We only collect information that is necessary for the autofill functionality:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Profile Data:</strong> Name, email, phone number, address, and other information you voluntarily save for autofill purposes</li>
          <li><strong>Local Storage Data:</strong> Your profile information is stored locally on your device using Chrome's storage API</li>
          <li><strong>Usage Data:</strong> Minimal technical data about how the extension functions (no personal information)</li>
        </ul>

        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '15px',
          borderLeft: '4px solid #3498db',
          margin: '20px 0'
        }}>
          <strong>Important:</strong> Fillux does NOT collect, store, or transmit any of your personal information to external servers. All data remains on your local device.
        </div>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>2. How We Use Your Information</h2>
        <p>We use your information solely for:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Automatically filling web forms with your saved profile data</li>
          <li>Storing your profile locally for quick access</li>
          <li>Improving the extension's functionality (using anonymous usage data only)</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>2.1. Data Storage and Security</h2>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Local Storage:</strong> All profile data is stored locally on your device using Chrome's secure storage API</li>
          <li><strong>No Cloud Storage:</strong> We do not use cloud services or external servers to store your data</li>
          <li><strong>No Data Collection:</strong> We do not collect, track, or transmit your personal information</li>
          <li><strong>No Third-Party Sharing:</strong> We do not share your data with any third parties</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>3. Information We DON'T Collect</h2>
        <p>Fillux is designed to respect your privacy. We do NOT collect:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Browsing history or websites you visit</li>
          <li>Form data that you don't explicitly save to your profile</li>
          <li>Personal identifiers beyond what you store in your profile</li>
          <li>Location data, device information, or analytics</li>
          <li>Any data transmitted to external servers</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>4. Data Retention</h2>
        <p>Your profile data remains stored locally on your device until you:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Manually delete it from the extension settings</li>
          <li>Uninstall the Fillux extension</li>
          <li>Clear your browser's extension data</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>5. Your Rights and Choices</h2>
        <p>You have complete control over your data:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Access:</strong> View and edit your profile data at any time through the extension popup</li>
          <li><strong>Deletion:</strong> Delete your profile data completely from the extension settings</li>
          <li><strong>Opt-out:</strong> Disable autofill functionality or uninstall the extension entirely</li>
          <li><strong>No Tracking:</strong> We don't track you, so there's nothing to opt-out from</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>6. Third-Party Services</h2>
        <p>Fillux does NOT use any third-party services that collect or process your personal data.</p>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>7. Security</h2>
        <p>We implement security measures to protect your data:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Data is stored using Chrome's secure storage APIs</li>
          <li>No data transmission over networks</li>
          <li>Regular security updates to the extension</li>
        </ul>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>8. Children's Privacy</h2>
        <p>Fillux is not directed to children under 13. We do not knowingly collect information from children under 13.</p>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>9. Changes to This Privacy Policy</h2>
        <p>We may update this privacy policy occasionally. We will notify users of significant changes by updating the date at the top of this policy.</p>

        <h2 style={{ color: '#34495e', marginTop: '30px' }}>10. Contact Us</h2>
        <p>If you have questions about this privacy policy or Fillux's privacy practices, please contact us:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Email:</strong> privacy@fillux.com</li>
          <li><strong>Extension Support:</strong> Through the Chrome Web Store extension page</li>
        </ul>

        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '15px',
          borderLeft: '4px solid #3498db',
          margin: '20px 0'
        }}>
          <strong>Commitment to Privacy:</strong> Fillux is committed to maintaining your privacy and ensuring your personal data remains secure and under your control at all times.
        </div>
      </div>
    </div>
  );
};

export default Privacy;