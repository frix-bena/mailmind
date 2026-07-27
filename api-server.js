const express = require('express');
const cors = require('cors');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;

const app = express();
app.use(cors());
app.use(express.json());

// Fake AI categorization based on keywords to simulate n8n for the UI
function categorizeEmail(subject, text) {
  const content = (subject + ' ' + text).toLowerCase();
  
  if (content.includes('invoice') || content.includes('receipt') || content.includes('payment') || content.includes('paid')) {
    return { category: 'receipt', needsReply: false, urgency: 'low', summary: 'Billing/Receipt notification. No action needed.' };
  }
  if (content.includes('newsletter') || content.includes('unsubscribe') || content.includes('digest')) {
    return { category: 'newsletter', needsReply: false, urgency: 'low', summary: 'Automated newsletter or digest.' };
  }
  if (content.includes('security') || content.includes('alert') || content.includes('password') || content.includes('sign in')) {
    return { category: 'notification', needsReply: false, urgency: 'high', summary: 'Security alert or automated notification.' };
  }
  
  // Default to important/needs reply
  return { 
    category: 'direct_message', 
    needsReply: true, 
    urgency: content.includes('urgent') || content.includes('asap') || content.includes('today') ? 'high' : 'medium',
    summary: 'Direct email requiring your attention.' 
  };
}

app.post('/api/fetch-emails', async (req, res) => {
  const { email, password, provider } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const host = provider === 'microsoft' ? 'outlook.office365.com' : 'imap.gmail.com';

  const config = {
    imap: {
      user: email,
      password: password,
      host: host,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    // Fetch the 15 most recent emails
    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      struct: true,
      markSeen: false
    };

    // Grab the total count to just get the latest 15
    const box = await connection.openBox('INBOX');
    const total = box.messages.total;
    const fromSeq = Math.max(1, total - 14);
    const results = await connection.seq.search([`${fromSeq}:*`], fetchOptions);

    const emails = [];
    
    for (const item of results) {
      const allParts = item.parts.find(part => part.which === '');
      const id = item.attributes.uid;
      
      const parsed = await simpleParser(allParts.body);
      
      const subject = parsed.subject || 'No Subject';
      const sender = parsed.from && parsed.from.value[0] ? parsed.from.value[0].name || parsed.from.value[0].address : 'Unknown';
      const senderEmail = parsed.from && parsed.from.value[0] ? parsed.from.value[0].address : 'unknown@domain.com';
      const date = parsed.date || new Date();
      const bodyText = parsed.text || '';
      const bodyHtml = parsed.html || parsed.textAsHtml || parsed.text || '';

      const { category, needsReply, urgency, summary } = categorizeEmail(subject, bodyText);
      
      // Auto-generate a dummy draft if it needs a reply
      const draft = needsReply ? `Hi ${sender.split(' ')[0]},\n\nThanks for reaching out! I've received your email regarding "${subject}".\n\nI'll review this and get back to you shortly.\n\nBest,\n${email.split('@')[0]}` : null;

      emails.push({
        id: id.toString(),
        sender,
        senderEmail,
        subject,
        receivedAt: date.toISOString(),
        body: bodyHtml,
        category,
        needsReply,
        urgency,
        summary,
        draft,
        draftStatus: needsReply ? 'pending' : null
      });
    }

    connection.end();
    
    // Sort newest first
    emails.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    
    res.json({ success: true, emails });
  } catch (error) {
    console.error('IMAP Error:', error);
    res.status(500).json({ error: 'Failed to connect to email server. Make sure you are using an App Password if using Gmail.' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Email bridge API running on http://localhost:${PORT}`);
});
