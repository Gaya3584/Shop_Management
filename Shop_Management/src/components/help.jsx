import React from 'react';
import './help.css';

const Help = () => {
  return (
    <div className="help-container">
      <h2>Help Center</h2>

      <section className="faq-section">
        <h3>Frequently Asked Questions</h3>
        <details>
          <summary>How do I add stock?</summary>
          <p>Navigate to the Stock page and click "Add Item".</p>
        </details>
        <details>
          <summary>Why is my email not verifying?</summary>
          <p>Check your spam folder and click the resend link.</p>
        </details>
        <details>
          <summary>How do I change my password?</summary>
          <p>Go to Settings &gt; Security section and update it.</p>
        </details>
      </section>

      <section className="support-section">
        <h3>Contact Support</h3>
        <form>
          <input type="text" placeholder="Your Name" required />
          <input type="email" placeholder="Your Email" required />
          <textarea placeholder="Describe your issue" rows="4" required></textarea>
          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </section>
      <button className="btn btn-back" onClick={() => window.history.back()}>
            Back
          </button>
    </div>
  );
};

export default Help;
