import { MailService } from '@sendgrid/mail';

let mailService: MailService | null = null;

if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not provided - email functionality will be disabled");
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn('Email service not available - skipping email send');
    return false;
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  const georgianSubject = `შეკვეთის დადასტურება - ${orderId}`;
  const georgianHtml = `
    <h2>მადლობა შეკვეთისთვის!</h2>
    <p>ძვირფასო ${customerName},</p>
    <p>თქვენი შეკვეთა წარმატებით მიიღეს.</p>
    <p><strong>შეკვეთის ID:</strong> ${orderId}</p>
    <p>ჩვენ მალე დაგიკავშირდებით პროექტის დეტალების განსახილველად.</p>
    <br>
    <p>პატივისცემით,<br>n8n ავტომატიზაციის გუნდი</p>
  `;

  return sendEmail({
    to: customerEmail,
    from: process.env.FROM_EMAIL || 'info@n8n-georgia.com',
    subject: georgianSubject,
    html: georgianHtml,
  });
}

export async function sendOrderNotificationEmail(
  adminEmail: string,
  order: any
): Promise<boolean> {
  const subject = `New Order Received - ${order.orderId}`;
  const html = `
    <h2>New Order Notification</h2>
    <p><strong>Order ID:</strong> ${order.orderId}</p>
    <p><strong>Customer:</strong> ${order.fullName} (${order.email})</p>
    <p><strong>Project:</strong> ${order.projectName}</p>
    <p><strong>Type:</strong> ${order.automationType}</p>
    ${order.company ? `<p><strong>Company:</strong> ${order.company}</p>` : ''}
    <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <p>Please review the order details in the admin dashboard.</p>
  `;

  return sendEmail({
    to: adminEmail,
    from: process.env.FROM_EMAIL || 'system@n8n-georgia.com',
    subject,
    html,
  });
}
