interface EmailTemplateData {
  [key: string]: any;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #fff; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .button { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Teach2Give Care</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Teach2Give Care. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

export const appointmentConfirmation = (data: EmailTemplateData) => {
  const content = `
    <h2>Appointment Confirmed ✅</h2>
    <p>Hello ${data.userName},</p>
    <p>Your appointment has been successfully booked with Dr. ${data.doctorName}.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Date: ${data.date}</li>
      <li>Time: ${data.timeSlot}</li>
      <li>Location: ${data.location || 'Main Clinic'}</li>
    </ul>
    <p>Total Amount: $${data.amount}</p>
    <p style="margin-top: 20px;">
      <a href="${data.dashboardUrl}" class="button">View Appointment</a>
    </p>
  `;
  return baseTemplate(content);
};

export const appointmentStatusUpdate = (data: EmailTemplateData) => {
  const content = `
    <h2>Appointment Status Update</h2>
    <p>Hello ${data.userName},</p>
    <p>Your appointment #${data.appointmentId} has been marked as <strong>${data.status}</strong>.</p>
    ${data.status === 'Completed' ? `
      <p>We hope you had a great experience. Please take a moment to:</p>
      <ul>
        <li><a href="${data.feedbackUrl}">Provide feedback</a></li>
        <li><a href="${data.prescriptionUrl}">View your prescription</a> (if provided)</li>
      </ul>
    ` : ''}
    <p>If you have any questions, please don't hesitate to contact us.</p>
  `;
  return baseTemplate(content);
};

export const paymentConfirmation = (data: EmailTemplateData) => {
  const content = `
    <h2>Payment Confirmation 💳</h2>
    <p>Hello ${data.userName},</p>
    <p>We've received your payment of <strong>$${data.amount}</strong> for appointment #${data.appointmentId}.</p>
    <p><strong>Payment Details:</strong></p>
    <ul>
      <li>Transaction ID: ${data.transactionId}</li>
      <li>Date: ${data.paymentDate}</li>
      <li>Method: ${data.paymentMethod}</li>
    </ul>
    <p>A receipt has been attached to this email for your records.</p>
  `;
  return baseTemplate(content);
};

export const prescriptionNotification = (data: EmailTemplateData) => {
  const content = `
    <h2>New Prescription Available 📋</h2>
    <p>Hello ${data.userName},</p>
    <p>A new prescription has been issued by Dr. ${data.doctorName} following your appointment on ${data.appointmentDate}.</p>
    <p>You can view and download your prescription from your dashboard:</p>
    <p style="margin-top: 20px;">
      <a href="${data.prescriptionUrl}" class="button">View Prescription</a>
    </p>
    <p><small>For your security, the prescription link will expire in 24 hours.</small></p>
  `;
  return baseTemplate(content);
};