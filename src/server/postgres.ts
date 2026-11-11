/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { db as inMemDb } from './db.ts';

const dataDir = path.resolve(process.cwd(), 'data/postgres');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export class PostgresService {
  public pg: PGlite | null = null;
  public isReady = false;

  async init() {
    try {
      this.pg = new PGlite(dataDir);
      await this.createTables();
      await this.seedData();
      this.isReady = true;
      console.log('[PostgreSQL 16 WASM] Embedded Database initialized at data/postgres');
    } catch (err) {
      console.error('[PostgreSQL Error] Failed to initialize embedded database:', err);
    }
  }

  private async createTables() {
    if (!this.pg) return;

    await this.pg.exec(`
      CREATE TABLE IF NOT EXISTS company (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        legal_name VARCHAR(255) NOT NULL,
        base_currency VARCHAR(10) NOT NULL,
        currency_symbol VARCHAR(10) NOT NULL,
        modes JSONB NOT NULL,
        auto_approve_limits JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS branches (
        id VARCHAR(64) PRIMARY KEY,
        parent_id VARCHAR(64),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(32) UNIQUE NOT NULL,
        type VARCHAR(32) NOT NULL,
        address TEXT,
        phone VARCHAR(64),
        invoice_prefix VARCHAR(16),
        is_active BOOLEAN DEFAULT TRUE,
        path VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(64) PRIMARY KEY,
        parent_id VARCHAR(64),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(32) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        path VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(64),
        role VARCHAR(64) NOT NULL,
        branch_id VARCHAR(64) REFERENCES branches(id),
        department_id VARCHAR(64),
        access_scope VARCHAR(32) NOT NULL,
        approval_limit NUMERIC(14, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(64) PRIMARY KEY,
        parent_id VARCHAR(64),
        name VARCHAR(255) NOT NULL,
        branch_id VARCHAR(64) REFERENCES branches(id),
        type VARCHAR(32) NOT NULL,
        code VARCHAR(32) UNIQUE NOT NULL,
        qr_token VARCHAR(64) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(64) PRIMARY KEY,
        number VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        tag VARCHAR(64) UNIQUE NOT NULL,
        branch_id VARCHAR(64) REFERENCES branches(id),
        department_id VARCHAR(64),
        category_id VARCHAR(64),
        location_id VARCHAR(64) REFERENCES locations(id),
        criticality VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        make VARCHAR(128),
        model VARCHAR(128),
        serial_number VARCHAR(128),
        purchase_date DATE,
        purchase_cost NUMERIC(14, 2),
        warranty_expiry DATE,
        meter_reading NUMERIC(14, 2),
        meter_unit VARCHAR(32),
        qr_token VARCHAR(64) UNIQUE NOT NULL,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS work_requests (
        id VARCHAR(64) PRIMARY KEY,
        number VARCHAR(32) UNIQUE NOT NULL,
        source VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(32) NOT NULL,
        category VARCHAR(64),
        branch_id VARCHAR(64) REFERENCES branches(id),
        asset_id VARCHAR(64) REFERENCES assets(id),
        requester_name VARCHAR(128),
        requester_phone VARCHAR(64),
        requester_email VARCHAR(128),
        status VARCHAR(32) NOT NULL,
        tracking_token VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(64) PRIMARY KEY,
        number VARCHAR(32) UNIQUE NOT NULL,
        type VARCHAR(32) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(32) NOT NULL,
        branch_id VARCHAR(64) REFERENCES branches(id),
        asset_id VARCHAR(64) REFERENCES assets(id),
        location_id VARCHAR(64) REFERENCES locations(id),
        job_kind VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        assigned_to_id VARCHAR(64) REFERENCES users(id),
        estimated_hours NUMERIC(8, 2) DEFAULT 0,
        estimated_cost NUMERIC(14, 2) DEFAULT 0,
        actual_cost NUMERIC(14, 2) DEFAULT 0,
        sla_response_due_at TIMESTAMP WITH TIME ZONE,
        sla_resolution_due_at TIMESTAMP WITH TIME ZONE,
        customer_rating INT,
        tasks JSONB DEFAULT '[]'::jsonb,
        labor JSONB DEFAULT '[]'::jsonb,
        parts JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS pm_plans (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        asset_id VARCHAR(64) REFERENCES assets(id),
        interval_value INT NOT NULL,
        interval_unit VARCHAR(32) NOT NULL,
        trigger_type VARCHAR(32) DEFAULT 'Time',
        next_due_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS parts (
        id VARCHAR(64) PRIMARY KEY,
        sku VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id VARCHAR(64),
        unit_of_measure VARCHAR(32),
        standard_cost NUMERIC(14, 2) NOT NULL,
        billable_price NUMERIC(14, 2) NOT NULL,
        reorder_point INT NOT NULL,
        quantity_on_hand INT NOT NULL,
        quantity_reserved INT DEFAULT 0,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS stock_transactions (
        id VARCHAR(64) PRIMARY KEY,
        part_id VARCHAR(64) REFERENCES parts(id),
        store_id VARCHAR(64),
        type VARCHAR(32) NOT NULL,
        quantity INT NOT NULL,
        unit_cost NUMERIC(14, 2) NOT NULL,
        reference VARCHAR(255),
        performed_by_id VARCHAR(64) REFERENCES users(id),
        at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(64) PRIMARY KEY,
        number VARCHAR(32) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        billing_address TEXT,
        payment_terms VARCHAR(64),
        credit_limit NUMERIC(14, 2) DEFAULT 0,
        balance NUMERIC(14, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(64) PRIMARY KEY,
        number VARCHAR(32) UNIQUE NOT NULL,
        customer_id VARCHAR(64) REFERENCES customers(id),
        branch_id VARCHAR(64) REFERENCES branches(id),
        status VARCHAR(32) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal NUMERIC(14, 2) NOT NULL,
        tax_total NUMERIC(14, 2) NOT NULL,
        total NUMERIC(14, 2) NOT NULL,
        amount_paid NUMERIC(14, 2) DEFAULT 0,
        balance NUMERIC(14, 2) NOT NULL,
        maker_id VARCHAR(64) REFERENCES users(id),
        checker_id VARCHAR(64) REFERENCES users(id),
        lines JSONB DEFAULT '[]'::jsonb,
        version INT DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id VARCHAR(64) PRIMARY KEY,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        entity_number VARCHAR(64) NOT NULL,
        summary TEXT NOT NULL,
        amount NUMERIC(14, 2) NOT NULL,
        maker_id VARCHAR(64) REFERENCES users(id),
        checker_id VARCHAR(64) REFERENCES users(id),
        status VARCHAR(32) NOT NULL,
        payload_hash VARCHAR(64) NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        decided_at TIMESTAMP WITH TIME ZONE,
        CHECK (checker_id IS NULL OR checker_id <> maker_id)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id VARCHAR(64) PRIMARY KEY,
        at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actor_id VARCHAR(64) NOT NULL,
        actor_name VARCHAR(128) NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        details TEXT NOT NULL,
        hash VARCHAR(64) NOT NULL,
        previous_hash VARCHAR(64) NOT NULL
      );
    `);
  }

  private async seedData() {
    if (!this.pg) return;

    // Check if company already seeded
    const res = await this.pg.query<{ count: string }>('SELECT count(*) as count FROM company');
    if (parseInt(res.rows[0].count, 10) > 0) return;

    // Seed Company
    await this.pg.query(
      `INSERT INTO company (id, name, legal_name, base_currency, currency_symbol, modes, auto_approve_limits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        inMemDb.company.id,
        inMemDb.company.name,
        inMemDb.company.legalName,
        inMemDb.company.baseCurrency,
        inMemDb.company.currencySymbol,
        JSON.stringify(inMemDb.company.modes),
        JSON.stringify(inMemDb.company.autoApproveLimits),
      ]
    );

    // Seed Branches
    for (const b of inMemDb.branches) {
      await this.pg.query(
        `INSERT INTO branches (id, parent_id, name, code, type, address, phone, invoice_prefix, path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [b.id, b.parentId || null, b.name, b.code, b.type, b.address, b.phone, b.invoicePrefix || null, b.path]
      );
    }

    // Seed Departments
    for (const d of inMemDb.departments) {
      await this.pg.query(
        `INSERT INTO departments (id, parent_id, name, code, path)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [d.id, d.parentId || null, d.name, d.code, d.path]
      );
    }

    // Seed Users
    for (const u of inMemDb.users) {
      await this.pg.query(
        `INSERT INTO users (id, name, email, phone, role, branch_id, department_id, access_scope, approval_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [u.id, u.name, u.email, u.phone, u.role, u.branchId, u.departmentId, u.accessScope, u.approvalLimit || 0]
      );
    }

    // Seed Locations
    for (const l of inMemDb.locations) {
      await this.pg.query(
        `INSERT INTO locations (id, parent_id, name, branch_id, type, code, qr_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [l.id, l.parentId || null, l.name, l.branchId, l.type, l.code, l.qrToken]
      );
    }

    // Seed Assets
    for (const a of inMemDb.assets) {
      await this.pg.query(
        `INSERT INTO assets (id, number, name, tag, branch_id, department_id, category_id, location_id, criticality, status, make, model, serial_number, purchase_date, purchase_cost, warranty_expiry, meter_reading, meter_unit, qr_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) ON CONFLICT DO NOTHING`,
        [
          a.id, a.number, a.name, a.tag, a.branchId, a.departmentId || null, a.categoryId, a.locationId,
          a.criticality, a.status, a.make, a.model, a.serialNumber, a.purchaseDate, a.purchaseCost,
          a.warrantyExpiry, a.meterReading || null, a.meterUnit || null, a.qrToken,
        ]
      );
    }

    // Seed Parts
    for (const p of inMemDb.parts) {
      await this.pg.query(
        `INSERT INTO parts (id, sku, name, description, category_id, unit_of_measure, standard_cost, billable_price, reorder_point, quantity_on_hand, quantity_reserved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING`,
        [
          p.id, p.sku, p.name, p.description, p.categoryId, p.unitOfMeasure,
          p.standardCost, p.billablePrice, p.reorderPoint, p.quantityOnHand, p.quantityReserved,
        ]
      );
    }

    // Seed Customers
    for (const c of inMemDb.customers) {
      await this.pg.query(
        `INSERT INTO customers (id, number, name, email, phone, billing_address, payment_terms, credit_limit, balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [c.id, c.number, c.name, c.email, c.phone, c.billingAddress, c.paymentTerms, c.creditLimit, c.balance]
      );
    }

    // Seed Work Orders
    for (const wo of inMemDb.workOrders) {
      await this.pg.query(
        `INSERT INTO work_orders (id, number, type, title, description, priority, branch_id, asset_id, location_id, job_kind, status, assigned_to_id, estimated_hours, estimated_cost, actual_cost, tasks, labor, parts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT DO NOTHING`,
        [
          wo.id, wo.number, wo.type, wo.title, wo.description, wo.priority, wo.branchId, wo.assetId || null,
          wo.locationId, wo.jobKind, wo.status, wo.assignedToId || null, wo.estimatedHours, wo.estimatedCost,
          wo.actualCost, JSON.stringify(wo.tasks), JSON.stringify(wo.labor), JSON.stringify(wo.parts),
        ]
      );
    }

    // Seed Work Requests
    for (const req of inMemDb.workRequests) {
      await this.pg.query(
        `INSERT INTO work_requests (id, number, source, title, description, priority, category, branch_id, asset_id, requester_name, requester_phone, requester_email, status, tracking_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT DO NOTHING`,
        [
          req.id, req.number, req.source, req.title, req.description, req.priority, req.category,
          req.branchId, req.assetId || null, req.requesterName, req.requesterPhone, req.requesterEmail,
          req.status, req.trackingToken,
        ]
      );
    }

    // Seed Approvals
    for (const a of inMemDb.approvals) {
      await this.pg.query(
        `INSERT INTO approvals (id, entity_type, entity_id, entity_number, summary, amount, maker_id, checker_id, status, payload_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
        [a.id, a.entityType, a.entityId, a.entityNumber, a.summary, a.amount, a.makerId, a.checkerId || null, a.status, a.payloadHash]
      );
    }

    // Seed Audit Log
    for (const al of inMemDb.auditLog) {
      await this.pg.query(
        `INSERT INTO audit_log (id, actor_id, actor_name, action, entity_type, entity_id, details, hash, previous_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [al.id, al.actorId, al.actorName, al.action, al.entityType, al.entityId, al.details, al.hash, al.previousHash]
      );
    }
  }

  async executeQuery(sqlText: string, params: any[] = []) {
    if (!this.pg) throw new Error('PostgreSQL database not initialized');
    return await this.pg.query(sqlText, params);
  }

  async getTableStats() {
    if (!this.pg) return [];
    const tables = [
      'company',
      'branches',
      'departments',
      'users',
      'locations',
      'assets',
      'work_requests',
      'work_orders',
      'pm_plans',
      'parts',
      'stock_transactions',
      'customers',
      'invoices',
      'approvals',
      'audit_log',
    ];

    const stats = [];
    for (const t of tables) {
      try {
        const res = await this.pg.query<{ count: string }>(`SELECT count(*) as count FROM ${t}`);
        stats.push({
          table: t,
          count: parseInt(res.rows[0]?.count || '0', 10),
        });
      } catch (e) {
        stats.push({ table: t, count: 0 });
      }
    }
    return stats;
  }
}

export const postgresDb = new PostgresService();
postgresDb.init();
