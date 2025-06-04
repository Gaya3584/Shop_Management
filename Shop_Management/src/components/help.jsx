import React, { useState } from 'react';
import './help.css';

const Help = () => {
  const [issue, setIssue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getContact = async (e) => {
    e.preventDefault(); // Prevent page reload

    try {
      const res = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ issue })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Message sent successfully!');
        setIssue('');
        setError('');
      } else {
        setError(data.message || 'Failed to send message');
        setSuccess('');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Something went wrong');
      setSuccess('');
    }
  };

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
        <form onSubmit={getContact}>
          <textarea
            placeholder="Describe your issue"
            rows="4"
            required
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
          ></textarea>
          <button type="submit" className="submit-btn">Submit</button>
        </form>

        {success && <p className="success-msg">{success}</p>}
        {error && <p className="error-msg">{error}</p>}
      </section>

      <button className="btn btn-back" onClick={() => window.history.back()}>
        Back
      </button>
    </div>
  );
};

export default Help;
