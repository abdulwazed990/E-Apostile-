/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { dbService } from './server/db';
import { createServer as createViteServer } from 'vite';
import { Certificate } from './src/types';

// Extend Express Request type to include auth data
interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
  };
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bd-e-apostille-secret-key-2026-mofa';

// Increase payload limits for uploading base64 signatures/seals
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Admin authentication middleware
const authenticateAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authorization token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Invalid or expired session token' });
    return;
  }
};

// ==========================================
// API ENDPOINTS
// ==========================================

// Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const normalizedUsername = String(username).trim();
    const normalizedPassword = String(password);

    const isValid = dbService.verifyAdminPassword(normalizedPassword);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials. Please check your password.' });
      return;
    }

    // Sign token valid for 24 hours
    const token = jwt.sign({ username: normalizedUsername }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true,
      token,
      username: normalizedUsername,
      message: 'Login successful'
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, message: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

// Verify Current Token Validity
app.get('/api/auth/verify-token', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ valid: false });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    res.json({ valid: true, username: decoded.username || 'admin' });
  } catch (err) {
    res.json({ valid: false });
  }
});

// PUBLIC: Verify Certificate by Unique ID
app.get('/api/certificates/verify/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const certificate = dbService.getCertificateById(id);

  if (!certificate) {
    res.status(404).json({ success: false, message: '✗ Invalid Certificate: No matching record found.' });
    return;
  }

  res.json({
    success: true,
    message: '✓ Verified Certificate',
    certificate,
    customDomain: dbService.getSettings().customDomain || ''
  });
});

// PUBLIC: Get list of active certificate IDs for navigation/testing purposes
app.get('/api/public/certificates', (req: Request, res: Response) => {
  const certificates = dbService.getCertificates();
  res.json({
    success: true,
    certificates: certificates.map(c => ({ id: c.id, applicantName: c.applicantName }))
  });
});

// ADMIN: Get all certificates (with optional search query)
app.get('/api/certificates', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const searchQuery = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
  const certificates = dbService.getCertificates();

  if (!searchQuery) {
    res.json({ success: true, certificates });
    return;
  }

  // Safe client-side structured filtering to prevent any query leakage or parsing error
  const filtered = certificates.filter(cert => {
    return (
      cert.id.toLowerCase().includes(searchQuery) ||
      cert.applicantName.toLowerCase().includes(searchQuery) ||
      (cert.fatherName && cert.fatherName.toLowerCase().includes(searchQuery)) ||
      cert.certificateType.toLowerCase().includes(searchQuery) ||
      (cert.boardName && cert.boardName.toLowerCase().includes(searchQuery)) ||
      (cert.certificateNumber && cert.certificateNumber.toLowerCase().includes(searchQuery))
    );
  });

  res.json({ success: true, certificates: filtered });
});

// ADMIN: Create Certificate
app.post('/api/certificates', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;

    // Field-level backend validation
    const required = [
      'applicantName'
    ];

    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        res.status(400).json({ success: false, message: `Field '${field}' is required.` });
        return;
      }
    }

    // Auto-generate verification ID if none supplied
    let verificationId = data.id ? String(data.id).trim().toUpperCase() : '';
    if (!verificationId) {
      const stamp = Math.floor(10000 + Math.random() * 90000); // 5 digits random
      const year = data.issueDate ? new Date(data.issueDate).getFullYear() : new Date().getFullYear();
      verificationId = `BD-AP-${year}-${stamp}`;
    }

    // Check uniqueness
    const existing = dbService.getCertificateById(verificationId);
    if (existing) {
      res.status(409).json({ success: false, message: `A Certificate with Verification ID "${verificationId}" already exists.` });
      return;
    }

    const settings = dbService.getSettings();

    const newCertificate: Certificate = {
      id: verificationId,
      applicantName: String(data.applicantName).trim().toUpperCase(),
      fatherName: data.fatherName ? String(data.fatherName).trim().toUpperCase() : '',
      motherName: data.motherName ? String(data.motherName).trim().toUpperCase() : '',
      dob: data.dob ? String(data.dob) : '',
      certificateType: data.certificateType ? String(data.certificateType) : 'Electronic Attestation',
      examinationName: data.examinationName ? String(data.examinationName).trim() : undefined,
      rollNumber: data.rollNumber ? String(data.rollNumber).trim() : undefined,
      registrationNumber: data.registrationNumber ? String(data.registrationNumber).trim() : undefined,
      certificateNumber: data.certificateNumber ? String(data.certificateNumber).trim() : `AP-${Date.now()}`,
      boardName: data.boardName ? String(data.boardName).trim() : undefined,
      country: data.country ? String(data.country).trim() : 'Bangladesh',
      issueDate: data.issueDate ? String(data.issueDate) : new Date().toISOString().split('T')[0],
      qrCodeDataUrl: data.qrCodeDataUrl || '', // Handled client-side or defaults
      officerName: data.officerName ? String(data.officerName).trim() : '',
      officerDesignation: data.officerDesignation ? String(data.officerDesignation).trim() : '',
      signatureImageUrl: data.signatureImageUrl || settings.globalSignatureUrl,
      sealImageUrl: data.sealImageUrl || settings.globalSealUrl,
      createdDate: new Date().toISOString(),
      status: 'VERIFIED',
      attachedCertificates: data.attachedCertificates || [],
      fullyAttestedDocumentUrl: data.fullyAttestedDocumentUrl || ''
    };

    dbService.addCertificate(newCertificate);

    res.status(201).json({
      success: true,
      message: 'Certificate registered successfully',
      certificate: newCertificate
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error creating certificate' });
  }
});

// ADMIN: Update Certificate
app.put('/api/certificates/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const updatedData = req.body;

  const success = dbService.updateCertificate(id, updatedData);
  if (!success) {
    res.status(404).json({ success: false, message: `Certificate with ID "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    message: 'Certificate updated successfully',
    certificate: dbService.getCertificateById(id)
  });
});

// ADMIN: Delete Certificate
app.delete('/api/certificates/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const success = dbService.deleteCertificate(id);

  if (!success) {
    res.status(404).json({ success: false, message: `Certificate with ID "${id}" not found.` });
    return;
  }

  res.json({
    success: true,
    message: 'Certificate deleted successfully'
  });
});

// ADMIN: Get Settings
app.get('/api/settings', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, settings: dbService.getSettings() });
});

// ADMIN: Update Settings
app.post('/api/settings', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { defaultLogoUrl, globalSealUrl, globalSignatureUrl, customDomain } = req.body;
  
  dbService.updateSettings({
    defaultLogoUrl,
    globalSealUrl,
    globalSignatureUrl,
    customDomain
  });

  res.json({
    success: true,
    message: 'System stamp/seal templates updated successfully',
    settings: dbService.getSettings()
  });
});

// ADMIN: Change Password
app.post('/api/settings/change-password', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, message: 'Old and new passwords are required' });
    return;
  }

  const success = dbService.changeAdminPassword(String(oldPassword), String(newPassword));
  if (!success) {
    res.status(400).json({ success: false, message: 'Incorrect old password' });
    return;
  }

  res.json({ success: true, message: 'Admin password changed successfully' });
});

// ==========================================
// VITE CLIENT DEV / PROD HANDLER
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Bangladesh e-Apostille Verification System running on http://localhost:${PORT}`);
  });
}

start();
