const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

exports.sendUserCreationEmail = (data) => { 
    const recipientEmail = data.recipientEmail || null;
    
    const msg = {
        to: recipientEmail,
        from: 'hello@airspaceoffice.co',
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      };
      sgMail.send(msg);
}