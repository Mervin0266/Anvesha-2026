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
import { validateParticipant, submitRegistration, getMasterInstitutions, getBankPaymentDetails, spotRegisterInstitution } from './controllers/registrationController';
import { getPendingVerifications, approveVerification, rejectVerification, updateParticipantName } from './controllers/verificationController';
import { getEventData, createOrUpdateFixture, submitEventResult, requestEdit, getEventsList, updateEventLiveStatus, updateRosterStatus, getTeamByChest, submitWinnerRunnerByChest, addMatchDetails, updateMatchDetailsByIndex, deleteMatchDetailsByIndex, finalizeMatchDetails } from './controllers/eventController';
import { getHospitalityData, updateHospitalityStatus } from './controllers/hospitalityController';
import { getCertificateData } from './controllers/certificateController';
import { 
  getAdminOverview, handleEditRequest, createCrewUser, getBankPayments, 
  addBankPayment, sendRegistrationInvitation, bulkAddBankPayments, 
  bulkSendRegistrationInvitations, updateBankPayment, deleteCrewUser, deleteBankPayment,
  bulkAddInstitutionMaster, getInstitutionMastersList, deleteInstitutionMaster,
  addInstitutionMaster, updateInstitutionMaster, bulkRegisterInstitutions, updateUserRole
} from './controllers/adminController';
import { getAnalyticsData } from './controllers/analyticsController';
import { initDb, dbQuery } from './services/db';

dotenv.config();

// Disable TLS/SSL certificate validation to resolve UNABLE_TO_VERIFY_LEAF_SIGNATURE errors
// caused by SSL-intercepting firewalls or proxy servers (common in university networks).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

// File upload receiver (Stops local disk storage, uploads directly to DB)
app.post('/api/upload', async (req, res) => {
  try {
    const { base64, fileName } = req.body;
    if (!base64 || !fileName) {
      return res.status(400).json({ success: false, message: 'Invalid upload payload.' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 encoding.' });
    }

    const mimeType = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const extension = path.extname(fileName) || '.png';
    const id = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;

    await dbQuery(
      `INSERT INTO uploaded_files (id, file_name, mime_type, file_data)
       VALUES ($1, $2, $3, $4)`,
      [id, fileName, mimeType, dataBuffer]
    );

    res.json({
      success: true,
      url: `${req.protocol}://${req.get('host')}/api/files/${id}`
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed.' });
  }
});

// Binary file streamer endpoint
app.get('/api/files/:fileId', async (req, res) => {
  const { fileId } = req.params;
  try {
    const fileRes = await dbQuery('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    const file = fileRes.rows[0];

    if (!file) {
      return res.status(404).send('File not found.');
    }

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
    res.send(file.file_data);
  } catch (error: any) {
    console.error('File retrieval error:', error);
    res.status(500).send('Failed to retrieve file.');
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
app.post('/api/registration/spot', spotRegisterInstitution);

// Event Day Verification Routes (Registration Team)
app.get('/api/verification/pending', getPendingVerifications);
app.post('/api/verification/approve', approveVerification);
app.post('/api/verification/reject', rejectVerification);
app.post('/api/verification/participant/update-name', updateParticipantName);

// Event Management Routes (Faculty per Event)
app.get('/api/events', getEventsList);
app.get('/api/events/:eventId', getEventData);
app.post('/api/events/fixture', createOrUpdateFixture);
app.post('/api/events/submit-result', submitEventResult);
app.post('/api/events/request-edit', requestEdit);
app.post('/api/events/:eventId/live-status', updateEventLiveStatus);
app.post('/api/events/:eventId/roster/verify', updateRosterStatus);
app.get('/api/events/team-by-chest/:chestNumber', getTeamByChest);
app.post('/api/events/results/chest', submitWinnerRunnerByChest);
app.post('/api/events/:eventId/match', addMatchDetails);
app.put('/api/events/:eventId/match/:index', updateMatchDetailsByIndex);
app.delete('/api/events/:eventId/match/:index', deleteMatchDetailsByIndex);
app.post('/api/events/:eventId/finalize-matches', finalizeMatchDetails);

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
app.post('/api/admin/users/update-role', updateUserRole);
app.delete('/api/admin/bank-payments/:paymentId', deleteBankPayment);
app.get('/api/admin/institution-master', getInstitutionMastersList);
app.post('/api/admin/institution-master', addInstitutionMaster);
app.put('/api/admin/institution-master/:id', updateInstitutionMaster);
app.post('/api/admin/institution-master/bulk', bulkAddInstitutionMaster);
app.delete('/api/admin/institution-master/:id', deleteInstitutionMaster);
app.post('/api/admin/bulk-register', bulkRegisterInstitutions);

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

