import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in a way that is compatible with both ESM and CommonJS
const getDirname = () => {
  try {
    return __dirname;
  } catch (e) {
    const filename = fileURLToPath(import.meta.url);
    return path.dirname(filename);
  }
};

// Ensure the uploads directory exists
const uploadsDir = path.join(getDirname(), '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

import { login, getMe } from './controllers/authController';
import { validateParticipant, submitRegistration, getMasterInstitutions, getBankPaymentDetails } from './controllers/registrationController';
import { getPendingVerifications, approveVerification, rejectVerification } from './controllers/verificationController';
import { getEventData, createOrUpdateFixture, submitEventResult, requestEdit, getEventsList, updateEventLiveStatus, updateRosterStatus } from './controllers/eventController';
import { getHospitalityData, updateHospitalityStatus } from './controllers/hospitalityController';
import { getCertificateData } from './controllers/certificateController';
import { 
  getAdminOverview, handleEditRequest, createCrewUser, getBankPayments, 
  addBankPayment, sendRegistrationInvitation, bulkAddBankPayments, 
  bulkSendRegistrationInvitations, updateBankPayment, deleteCrewUser, deleteBankPayment 
} from './controllers/adminController';
import { getAnalyticsData } from './controllers/analyticsController';
import { initDb } from './services/db';

dotenv.config();

// Disable TLS/SSL certificate validation to resolve UNABLE_TO_VERIFY_LEAF_SIGNATURE errors
// caused by SSL-intercepting firewalls or proxy servers (common in university networks).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// File upload receiver
app.post('/api/upload', (req, res) => {
  try {
    const { base64, fileName } = req.body;
    if (!base64 || !fileName) {
      return res.status(400).json({ success: false, message: 'Invalid upload payload.' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 encoding.' });
    }

    const dataBuffer = Buffer.from(matches[2], 'base64');
    const extension = path.extname(fileName) || '.png';
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${extension}`;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, dataBuffer);

    res.json({
      success: true,
      url: `http://localhost:5000/uploads/${uniqueName}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'ANVESHA Inter PU Fest Management API',
    institution: 'Christ University',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/login', login);
app.get('/api/auth/me', getMe);

// Public Registration Routes
app.get('/api/registration/master-institutions', getMasterInstitutions);
app.post('/api/registration/validate-participant', validateParticipant);
app.post('/api/registration/submit', submitRegistration);
app.get('/api/registration/payment-details/:paymentId', getBankPaymentDetails);

// Event Day Verification Routes (Registration Team)
app.get('/api/verification/pending', getPendingVerifications);
app.post('/api/verification/approve', approveVerification);
app.post('/api/verification/reject', rejectVerification);

// Event Management Routes (Faculty per Event)
app.get('/api/events', getEventsList);
app.get('/api/events/:eventId', getEventData);
app.post('/api/events/fixture', createOrUpdateFixture);
app.post('/api/events/submit-result', submitEventResult);
app.post('/api/events/request-edit', requestEdit);
app.post('/api/events/:eventId/live-status', updateEventLiveStatus);
app.post('/api/events/:eventId/roster/verify', updateRosterStatus);

// Hospitality Routes
app.get('/api/hospitality', getHospitalityData);
app.post('/api/hospitality/update', updateHospitalityStatus);

// Certificate Desk Routes
app.get('/api/certificates', getCertificateData);

// System Admin Routes
app.get('/api/admin/overview', getAdminOverview);
app.post('/api/admin/edit-request', handleEditRequest);
app.post('/api/admin/create-user', createCrewUser);
app.get('/api/admin/bank-payments', getBankPayments);
app.post('/api/admin/bank-payments', addBankPayment);
app.post('/api/admin/bank-payments/bulk', bulkAddBankPayments);
app.post('/api/admin/bank-payments/invite', sendRegistrationInvitation);
app.post('/api/admin/bank-payments/invite-bulk', bulkSendRegistrationInvitations);
app.post('/api/admin/bank-payments/update', updateBankPayment);
app.delete('/api/admin/users/:userId', deleteCrewUser);
app.delete('/api/admin/bank-payments/:paymentId', deleteBankPayment);

// Officials Analytics Routes
app.get('/api/analytics', getAnalyticsData);

// Initialize DB and Start Server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 ANVESHA API Backend running on http://localhost:${PORT}`);
      console.log(`📍 Christ University Inter PU Fest Management System`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('Fatal database initialization error. Server not started.', err);
    process.exit(1);
  });

