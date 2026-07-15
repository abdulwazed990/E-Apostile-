/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Certificate } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  certificates: Certificate[];
  adminHash: string;
  settings: {
    defaultLogoUrl: string;
    globalSealUrl: string;
    globalSignatureUrl: string;
    customDomain?: string;
  };
}

// Default Bangladesh administration seed values
const DEFAULT_LOGO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWdacpfhGqope2aL72T9lkMz1LH4Mb6WDJUSN30VQy2jnxKHZ_AurUpVJv&s=10";

// Standard transparent seals and signature templates
const DEFAULT_SEAL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><circle cx='60' cy='60' r='55' fill='none' stroke='%23006a4e' stroke-width='4' stroke-dasharray='1 1'/><circle cx='60' cy='60' r='48' fill='none' stroke='%23006a4e' stroke-width='2'/><text x='60' y='35' font-family='Arial, sans-serif' font-size='8' font-weight='bold' fill='%23006a4e' text-anchor='middle'>MINISTRY OF FOREIGN AFFAIRS</text><text x='60' y='64' font-family='Arial, sans-serif' font-size='10' font-weight='bold' fill='%23f42a41' text-anchor='middle'>* DHAKA *</text><text x='60' y='90' font-family='Arial, sans-serif' font-size='7' font-weight='bold' fill='%23006a4e' text-anchor='middle'>GOVERNMENT OF BANGLADESH</text></svg>";

const DEFAULT_SIGNATURE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50' viewBox='0 0 150 50'><path d='M10,25 Q30,5 50,25 T90,25 T130,20' fill='none' stroke='%230f2c59' stroke-width='2.5'/><text x='30' y='42' font-family='Courier, monospace' font-size='9' fill='%23555555'>Md. Nazrul Islam</text></svg>";

class DatabaseService {
  private dbCache: Schema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      // Securely hash default password 'admin123'
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);

      const initialData: Schema = {
        certificates: [],
        adminHash,
        settings: {
          defaultLogoUrl: DEFAULT_LOGO,
          globalSealUrl: DEFAULT_SEAL,
          globalSignatureUrl: DEFAULT_SIGNATURE,
          customDomain: ''
        }
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      this.dbCache = initialData;
    }
  }

  private readDb(): Schema {
    this.ensureInitialized();
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      this.dbCache = JSON.parse(content) as Schema;
      return this.dbCache;
    } catch (e) {
      if (this.dbCache) return this.dbCache;
      throw e;
    }
  }

  private writeDb(data: Schema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    this.dbCache = data;
  }

  public getCertificates(): Certificate[] {
    return this.readDb().certificates;
  }

  public getCertificateById(id: string): Certificate | undefined {
    const certs = this.getCertificates();
    // Neutralizing case matching and trimming to prevent input syntax injection issues
    const normalizedId = id.trim().toUpperCase();
    return certs.find(c => c.id.toUpperCase() === normalizedId);
  }

  public addCertificate(cert: Certificate) {
    const db = this.readDb();
    // Validate uniqueness of custom/generated ID
    if (db.certificates.some(c => c.id.toUpperCase() === cert.id.toUpperCase())) {
      throw new Error(`Certificate ID "${cert.id}" already exists.`);
    }
    db.certificates.unshift(cert);
    this.writeDb(db);
  }

  public updateCertificate(id: string, updatedCert: Partial<Certificate>): boolean {
    const db = this.readDb();
    const index = db.certificates.findIndex(c => c.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) return false;

    db.certificates[index] = {
      ...db.certificates[index],
      ...updatedCert,
      id: db.certificates[index].id, // Keep the key immutable during standard updates
    };
    this.writeDb(db);
    return true;
  }

  public deleteCertificate(id: string): boolean {
    const db = this.readDb();
    const lenBefore = db.certificates.length;
    db.certificates = db.certificates.filter(c => c.id.toUpperCase() !== id.trim().toUpperCase());
    if (db.certificates.length === lenBefore) return false;

    this.writeDb(db);
    return true;
  }

  public getSettings() {
    const settings = this.readDb().settings;
    if (settings && settings.customDomain === undefined) {
      settings.customDomain = '';
    }
    return settings;
  }

  public updateSettings(settings: Partial<Schema['settings']>) {
    const db = this.readDb();
    db.settings = { ...db.settings, ...settings };
    this.writeDb(db);
  }

  public verifyAdminPassword(password: string): boolean {
    const db = this.readDb();
    return bcrypt.compareSync(password, db.adminHash);
  }

  public changeAdminPassword(oldPass: string, newPass: string): boolean {
    const db = this.readDb();
    if (!bcrypt.compareSync(oldPass, db.adminHash)) {
      return false;
    }
    const salt = bcrypt.genSaltSync(10);
    db.adminHash = bcrypt.hashSync(newPass, salt);
    this.writeDb(db);
    return true;
  }
}

export const dbService = new DatabaseService();
