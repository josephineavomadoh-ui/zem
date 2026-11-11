/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { postgresDb } from './postgres.ts';
import {
  WorkOrder,
  WorkRequest,
  StockTransaction,
  Invoice,
  InvoiceLine,
  Payment,
  AuditLogEntry,
  PurchaseOrder,
  PurchaseOrderLine,
  Quote,
  QuoteLine,
} from '../types/index.ts';

export const apiRouter = Router();

// PostgreSQL Database Inspector & Query Endpoint
apiRouter.get('/database/status', async (_req: Request, res: Response) => {
  try {
    const tableStats = await postgresDb.getTableStats();
    res.json({
      engine: 'PostgreSQL 16 (Embedded WASM PGlite)',
      storage: 'Persistent (data/postgres)',
      status: postgresDb.isReady ? 'Connected & Active' : 'Initializing',
      tables: tableStats,
      totalTables: tableStats.length,
      totalRows: tableStats.reduce((sum, t) => sum + t.count, 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/database/query', async (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'Missing SQL query' });
  try {
    const result = await postgresDb.executeQuery(sql);
    res.json({
      success: true,
      command: (result as any).command || 'SELECT',
      rowCount: result.rows?.length ?? 0,
      fields: result.fields?.map((f: any) => f.name) || [],
      rows: result.rows || [],
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'SQL execution failed' });
  }
});

// Middleware to mock actor extraction from header or query (mimics session authentication)
apiRouter.use((req: Request, _res: Response, next) => {
  const actorId = (req.headers['x-user-id'] as string) || (req.query.actorId as string) || 'usr-sarah-mensah';
  const user = db.users.find((u) => u.id === actorId) || db.users[0];
  (req as any).user = user;
  next();
});

// Helper for actor
const getActor = (req: Request) => {
  return (req as any).user || db.users[0];
};

// 1. Meta & Config
apiRouter.get('/meta', (req: Request, res: Response) => {
  const actor = getActor(req);
  res.json({
    company: db.company,
    branches: db.branches,
    departments: db.departments,
    teams: db.teams,
    users: db.users,
    categories: db.categories,
    stores: db.stores,
    currentUser: actor,
  });
});

apiRouter.post('/company/settings', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { modes, name, legalName, baseCurrency, currencySymbol, autoApproveLimits } = req.body;
  if (modes) db.company.modes = { ...db.company.modes, ...modes };
  if (name) db.company.name = name;
  if (legalName) db.company.legalName = legalName;
  if (baseCurrency) db.company.baseCurrency = baseCurrency;
  if (currencySymbol) db.company.currencySymbol = currencySymbol;
  if (autoApproveLimits) db.company.autoApproveLimits = { ...db.company.autoApproveLimits, ...autoApproveLimits };

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Update',
    entityType: 'CompanySettings',
    entityId: db.company.id,
    details: 'Updated company configuration and operating modes',
    ip: req.ip || '127.0.0.1',
  });

  res.json({ success: true, company: db.company });
});

// Branch & Organization Endpoints
apiRouter.get('/branches', (_req: Request, res: Response) => {
  res.json(db.branches);
});

apiRouter.post('/branches', async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { name, code, type, parentId, address, phone, invoicePrefix, managerUserId } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Branch name and code are required' });
  }

  const existing = db.branches.find((b) => b.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: `Branch with code "${code}" already exists` });
  }

  const id = `br-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  const parentBranch = parentId ? db.branches.find((b) => b.id === parentId) : null;
  const path = parentBranch ? `${parentBranch.path}${id}/` : `/${id}/`;

  const newBranch = {
    id,
    parentId: parentId || undefined,
    name,
    code: code.toUpperCase(),
    type: type || 'Branch',
    address: address || '',
    phone: phone || '',
    invoicePrefix: (invoicePrefix || code.slice(0, 3)).toUpperCase(),
    managerUserId: managerUserId || actor.id,
    alternateApproverId: actor.id,
    isActive: true,
    path,
  };

  db.branches.push(newBranch as any);

  // Sync to PostgreSQL
  try {
    if (postgresDb.isReady) {
      await postgresDb.executeQuery(
        `INSERT INTO branches (id, parent_id, name, code, type, address, phone, invoice_prefix, is_active, path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET name = $3, address = $6, phone = $7, invoice_prefix = $8`,
        [
          newBranch.id,
          newBranch.parentId || null,
          newBranch.name,
          newBranch.code,
          newBranch.type,
          newBranch.address,
          newBranch.phone,
          newBranch.invoicePrefix,
          newBranch.isActive,
          newBranch.path,
        ]
      );
    }
  } catch (err: any) {
    console.warn('[PostgreSQL Sync Warning] Branch insert:', err.message);
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Branch',
    entityId: newBranch.id,
    details: `Created branch ${newBranch.name} (${newBranch.code})`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newBranch);
});

// Department Endpoints
apiRouter.get('/departments', (_req: Request, res: Response) => {
  res.json(db.departments);
});

apiRouter.post('/departments', async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { name, code, headUserId, parentId } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Department name and code are required' });
  }

  const id = `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  const path = `/${id}/`;

  const newDept = {
    id,
    parentId: parentId || undefined,
    name,
    code: code.toUpperCase(),
    headUserId: headUserId || actor.id,
    isActive: true,
    path,
  };

  db.departments.push(newDept as any);

  // Sync to PostgreSQL
  try {
    if (postgresDb.isReady) {
      await postgresDb.executeQuery(
        `INSERT INTO departments (id, parent_id, name, code, is_active, path)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [newDept.id, newDept.parentId || null, newDept.name, newDept.code, newDept.isActive, newDept.path]
      );
    }
  } catch (err: any) {
    console.warn('[PostgreSQL Sync Warning] Department insert:', err.message);
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Department',
    entityId: newDept.id,
    details: `Created department ${newDept.name} (${newDept.code})`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newDept);
});

// Users Endpoints
apiRouter.get('/users', (_req: Request, res: Response) => {
  res.json(db.users);
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  const actor = getActor(req);
  const { name, email, phone, role, branchId, departmentId, accessScope, approvalLimit } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `User with email "${email}" already exists` });
  }

  const id = `usr-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
  const newUser = {
    id,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    role: role || 'Field Technician',
    branchId: branchId || db.branches[0]?.id || 'br-accra-hq',
    departmentId: departmentId || db.departments[0]?.id || 'dept-engineering',
    accessScope: accessScope || 'Branch',
    teamIds: [],
    approvalLimit: typeof approvalLimit === 'number' ? approvalLimit : 500,
    isActive: true,
    locale: 'en-US',
    version: 1,
  };

  db.users.push(newUser as any);

  // Sync to PostgreSQL
  try {
    if (postgresDb.isReady) {
      await postgresDb.executeQuery(
        `INSERT INTO users (id, name, email, phone, role, branch_id, department_id, access_scope, approval_limit, is_active, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET name = $2, role = $5, branch_id = $6, approval_limit = $9`,
        [
          newUser.id,
          newUser.name,
          newUser.email,
          newUser.phone,
          newUser.role,
          newUser.branchId,
          newUser.departmentId,
          newUser.accessScope,
          newUser.approvalLimit,
          newUser.isActive,
          newUser.version,
        ]
      );
    }
  } catch (err: any) {
    console.warn('[PostgreSQL Sync Warning] User insert:', err.message);
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'User',
    entityId: newUser.id,
    details: `Provisioned user ${newUser.name} with role ${newUser.role}`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newUser);
});

// 2. Dashboards & Analytics KPIs
apiRouter.get('/dashboard/kpis', (_req: Request, res: Response) => {
  const closedOrders = db.workOrders.filter((w) => w.status === 'Closed' || w.status === 'Completed');
  const correctiveClosed = closedOrders.filter((w) => w.type === 'Corrective');
  
  // MTTR: average actual hours on corrective
  const totalCorrectiveHours = correctiveClosed.reduce((sum, w) => sum + (w.actualEnd && w.actualStart ? Math.max(1, (new Date(w.actualEnd).getTime() - new Date(w.actualStart).getTime()) / 3600000) : w.estimatedHours), 0);
  const mttr = correctiveClosed.length > 0 ? Number((totalCorrectiveHours / correctiveClosed.length).toFixed(1)) : 2.4;

  // MTBF: mock calculated operational hours per failure
  const totalAssets = db.assets.length;
  const mtbf = 720; // 720 hours ~ 30 days between critical stoppages

  // Availability %: (total hours - downtime) / total
  const totalDowntimeHours = db.downtimes.reduce((sum, d) => sum + (d.end ? (new Date(d.end).getTime() - new Date(d.start).getTime()) / 3600000 : 4), 0);
  const availability = totalAssets > 0 ? Number((99.6 - (totalDowntimeHours / (totalAssets * 720)) * 100).toFixed(1)) : 99.4;

  // PM Compliance
  const pmOrders = db.workOrders.filter((w) => w.type === 'Preventive');
  const completedPm = pmOrders.filter((w) => w.status === 'Completed' || w.status === 'Closed').length;
  const pmCompliance = pmOrders.length > 0 ? Math.round((completedPm / pmOrders.length) * 100) : 95;

  // Backlog
  const openBacklog = db.workOrders.filter((w) => !['Completed', 'Closed', 'Cancelled'].includes(w.status));

  // SLA attainment
  const slaOrders = db.workOrders.filter((w) => w.slaResponseDueAt);
  const breachedOrders = slaOrders.filter((w) => w.slaBreached);
  const slaAttainment = slaOrders.length > 0 ? Math.round(((slaOrders.length - breachedOrders.length) / slaOrders.length) * 100) : 96;

  // Pending Approvals
  const pendingApprovalsCount = db.approvals.filter((a) => a.status === 'Pending').length;

  // Financials (Contractor mode)
  const unbilledOrders = db.workOrders.filter((w) => w.jobKind === 'Billable' && w.status === 'Closed');
  const unbilledTotal = unbilledOrders.reduce((sum, w) => sum + w.actualCost * 1.35, 1250);
  const agedReceivables = db.invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + i.balance, 0);

  res.json({
    mttr,
    mtbf,
    availability: Math.max(92, Math.min(99.9, availability)),
    pmCompliance,
    backlogCount: openBacklog.length,
    slaAttainment,
    pendingApprovalsCount,
    unbilledTotal,
    agedReceivables,
    openOrdersCount: openBacklog.length,
    activeAssetsCount: db.assets.filter((a) => a.status === 'Operational').length,
    lowStockPartsCount: db.parts.filter((p) => p.quantityOnHand <= p.reorderPoint).length,
  });
});

// 3. Work Requests
apiRouter.get('/work-requests', (_req: Request, res: Response) => {
  res.json(db.workRequests);
});

apiRouter.post('/work-requests', (req: Request, res: Response) => {
  const actor = getActor(req);
  const body = req.body;
  const count = db.workRequests.length + 1;
  const num = `${db.company.numberPrefixes.request}${String(count).padStart(6, '0')}`;
  const trackingToken = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const newReq: WorkRequest = {
    id: `req-${Date.now()}`,
    number: num,
    source: body.source || 'Web',
    title: body.title,
    description: body.description,
    priority: body.priority || 'Medium',
    category: body.category || 'General',
    branchId: body.branchId || actor.branchId || 'br-accra-hq',
    departmentId: body.departmentId || actor.departmentId,
    locationId: body.locationId,
    assetId: body.assetId,
    customerId: body.customerId,
    customerSiteId: body.customerSiteId,
    requesterName: body.requesterName || actor.name,
    requesterPhone: body.requesterPhone || actor.phone,
    requesterEmail: body.requesterEmail || actor.email,
    requesterUserId: actor.id,
    status: 'Submitted',
    trackingToken,
    photoUrl: body.photoUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  db.workRequests.unshift(newReq);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'WorkRequest',
    entityId: newReq.id,
    entityNumber: newReq.number,
    details: `Created work request: "${newReq.title}"`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newReq);
});

apiRouter.post('/work-requests/:id/review', (req: Request, res: Response) => {
  const actor = getActor(req);
  const item = db.workRequests.find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found' });

  const { status, rejectionReason } = req.body;
  item.status = status;
  item.reviewedById = actor.id;
  item.reviewedAt = new Date().toISOString();
  item.rejectionReason = rejectionReason;
  item.updatedAt = new Date().toISOString();
  item.version += 1;

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'StatusChange',
    entityType: 'WorkRequest',
    entityId: item.id,
    entityNumber: item.number,
    details: `Work request status updated to ${status}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json(item);
});

apiRouter.post('/work-requests/:id/convert', (req: Request, res: Response) => {
  const actor = getActor(req);
  const item = db.workRequests.find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Request not found' });

  const woCount = db.workOrders.length + 1;
  const woNumber = `${db.company.numberPrefixes.workOrder}${String(woCount).padStart(6, '0')}`;

  const wo: WorkOrder = {
    id: `wo-${Date.now()}`,
    number: woNumber,
    type: 'Corrective',
    title: item.title,
    description: item.description,
    priority: item.priority,
    branchId: item.branchId,
    departmentId: item.departmentId,
    assetId: item.assetId,
    locationId: item.locationId || 'loc-ridge-site',
    requestId: item.id,
    customerId: item.customerId,
    jobKind: item.customerId ? 'Billable' : 'Internal',
    status: 'Open',
    estimatedHours: 2.0,
    estimatedCost: 150.0,
    actualCost: 0,
    slaResponseDueAt: new Date(Date.now() + 3600000 * 4).toISOString(),
    slaResolutionDueAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    slaPausedMs: 0,
    slaBreached: false,
    requiresVerification: true,
    tasks: [
      {
        id: `wot-${Date.now()}-1`,
        workOrderId: `wo-${Date.now()}`,
        sequence: 1,
        description: 'Conduct preliminary site safety and physical inspection',
        type: 'Check',
        isCompleted: false,
      },
      {
        id: `wot-${Date.now()}-2`,
        workOrderId: `wo-${Date.now()}`,
        sequence: 2,
        description: 'Isolate equipment and test electrical / mechanical parameters',
        type: 'Check',
        isCompleted: false,
      },
      {
        id: `wot-${Date.now()}-3`,
        workOrderId: `wo-${Date.now()}`,
        sequence: 3,
        description: 'Upload verification photo of repair work',
        type: 'Photo',
        isCompleted: false,
      },
    ],
    labor: [],
    parts: [],
    expenses: [],
    comments: [],
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        workOrderId: `wo-${Date.now()}`,
        from: 'Draft',
        to: 'Open',
        changedById: actor.id,
        changedByName: actor.name,
        at: new Date().toISOString(),
        note: `Converted from Work Request ${item.number}`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  item.status = 'Converted';
  item.convertedWorkOrderId = wo.id;
  item.updatedAt = new Date().toISOString();

  db.workOrders.unshift(wo);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'WorkOrder',
    entityId: wo.id,
    entityNumber: wo.number,
    details: `Converted Work Request ${item.number} to Work Order ${wo.number}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ request: item, workOrder: wo });
});

// 4. Work Orders
apiRouter.get('/work-orders', (_req: Request, res: Response) => {
  res.json(db.workOrders);
});

apiRouter.get('/work-orders/:id', (req: Request, res: Response) => {
  const item = db.workOrders.find((w) => w.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Work order not found' });
  res.json(item);
});

apiRouter.post('/work-orders', (req: Request, res: Response) => {
  const actor = getActor(req);
  const body = req.body;
  const woCount = db.workOrders.length + 1;
  const woNumber = `${db.company.numberPrefixes.workOrder}${String(woCount).padStart(6, '0')}`;

  const estCost = Number(body.estimatedCost || 0);
  // Dual control check: if cost exceeds limit, set to PendingApproval
  const isOverCostLimit = estCost > db.company.autoApproveLimits.workOrderCost;
  const initialStatus = isOverCostLimit ? 'PendingApproval' : (body.assignedToId ? 'Assigned' : 'Open');

  const wo: WorkOrder = {
    id: `wo-${Date.now()}`,
    number: woNumber,
    type: body.type || 'Corrective',
    title: body.title,
    description: body.description,
    priority: body.priority || 'Medium',
    branchId: body.branchId || actor.branchId || 'br-accra-hq',
    departmentId: body.departmentId || actor.departmentId,
    assetId: body.assetId,
    locationId: body.locationId || 'loc-ridge-site',
    customerId: body.customerId,
    contractId: body.contractId,
    jobKind: body.jobKind || (body.customerId ? 'Billable' : 'Internal'),
    status: initialStatus,
    teamId: body.teamId,
    assignedToId: body.assignedToId,
    assignedToName: body.assignedToId ? db.users.find((u) => u.id === body.assignedToId)?.name : undefined,
    plannedStart: body.plannedStart || new Date().toISOString(),
    plannedEnd: body.plannedEnd,
    estimatedHours: Number(body.estimatedHours || 2.0),
    estimatedCost: estCost,
    actualCost: 0,
    slaResponseDueAt: new Date(Date.now() + 3600000 * 4).toISOString(),
    slaResolutionDueAt: new Date(Date.now() + 3600000 * 24).toISOString(),
    slaPausedMs: 0,
    slaBreached: false,
    requiresVerification: true,
    tasks: (body.tasks || []).map((t: any, idx: number) => ({
      id: `wot-${Date.now()}-${idx}`,
      workOrderId: `wo-${Date.now()}`,
      sequence: idx + 1,
      description: t.description,
      type: t.type || 'Check',
      isCompleted: false,
    })),
    labor: [],
    parts: [],
    expenses: [],
    comments: [],
    statusHistory: [
      {
        id: `sh-${Date.now()}`,
        workOrderId: `wo-${Date.now()}`,
        from: 'Draft',
        to: initialStatus,
        changedById: actor.id,
        changedByName: actor.name,
        at: new Date().toISOString(),
        note: isOverCostLimit ? `Cost $${estCost} exceeds $${db.company.autoApproveLimits.workOrderCost} limit. Awaiting supervisor approval.` : 'Created work order',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  db.workOrders.unshift(wo);

  // If over cost limit, enqueue in dual control approval queue
  if (isOverCostLimit) {
    db.approvals.unshift({
      id: `appr-${Date.now()}`,
      entityType: 'WorkOrderCost',
      entityId: wo.id,
      entityNumber: wo.number,
      summary: `High Cost Work Order Authorization: "${wo.title}" ($${estCost})`,
      amount: estCost,
      branchId: wo.branchId,
      makerId: actor.id,
      makerName: actor.name,
      makerRole: actor.role,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      payloadHash: `hash-${Date.now()}`,
    });
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'WorkOrder',
    entityId: wo.id,
    entityNumber: wo.number,
    details: `Created work order: ${wo.number} (${wo.status})`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(wo);
});

apiRouter.post('/work-orders/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const { status, note, holdReason, assignedToId } = req.body;
  const oldStatus = wo.status;

  wo.status = status;
  if (holdReason) wo.holdReason = holdReason;
  if (assignedToId) {
    wo.assignedToId = assignedToId;
    wo.assignedToName = db.users.find((u) => u.id === assignedToId)?.name;
  }

  if (status === 'InProgress' && !wo.actualStart) {
    wo.actualStart = new Date().toISOString();
  }
  if (status === 'Completed' && !wo.actualEnd) {
    wo.actualEnd = new Date().toISOString();
  }

  wo.statusHistory.push({
    id: `sh-${Date.now()}`,
    workOrderId: wo.id,
    from: oldStatus,
    to: status,
    changedById: actor.id,
    changedByName: actor.name,
    at: new Date().toISOString(),
    note: note || `Status transitioned to ${status}`,
  });

  wo.updatedAt = new Date().toISOString();
  wo.version += 1;

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'StatusChange',
    entityType: 'WorkOrder',
    entityId: wo.id,
    entityNumber: wo.number,
    details: `Status transitioned from ${oldStatus} to ${status}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json(wo);
});

apiRouter.post('/work-orders/:id/tasks/:taskId/toggle', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const task = wo.tasks.find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.isCompleted = !task.isCompleted;
  task.completedById = task.isCompleted ? actor.id : undefined;
  task.completedAt = task.isCompleted ? new Date().toISOString() : undefined;
  if (req.body.result) task.result = req.body.result;

  wo.updatedAt = new Date().toISOString();
  res.json(wo);
});

apiRouter.post('/work-orders/:id/labor', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const { hours, rate, notes } = req.body;
  const numHours = Number(hours || 1);
  const hourlyRate = Number(rate || 45);
  const billableRate = hourlyRate * 1.4;

  wo.labor.push({
    id: `lab-${Date.now()}`,
    workOrderId: wo.id,
    userId: actor.id,
    userName: actor.name,
    startedAt: new Date(Date.now() - numHours * 3600000).toISOString(),
    endedAt: new Date().toISOString(),
    hours: numHours,
    rate: hourlyRate,
    billableRate,
    notes,
  });

  wo.actualCost += numHours * hourlyRate;
  wo.updatedAt = new Date().toISOString();

  res.json(wo);
});

apiRouter.post('/work-orders/:id/parts', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const { partId, quantity, storeId } = req.body;
  const part = db.parts.find((p) => p.id === partId);
  if (!part) return res.status(404).json({ error: 'Part not found' });

  const qty = Number(quantity || 1);
  const store = db.stores.find((s) => s.id === storeId) || db.stores[0];
  const totalCost = qty * part.standardCost;

  // Dual Control rule check on Stock Issue:
  // "Issues below the limit post at once; issues above the limit wait for a checker"
  const exceedsThreshold = totalCost > db.company.autoApproveLimits.stockIssue;

  if (exceedsThreshold) {
    // Requires Maker-Checker approval!
    const appr = {
      id: `appr-${Date.now()}`,
      entityType: 'StockIssue' as const,
      entityId: wo.id,
      entityNumber: `ISSUE-${wo.number}`,
      summary: `Stock Issue: ${qty}x ${part.name} for ${wo.number} ($${totalCost.toFixed(2)}) exceeds $${db.company.autoApproveLimits.stockIssue} limit`,
      amount: totalCost,
      branchId: wo.branchId,
      makerId: actor.id,
      makerName: actor.name,
      makerRole: actor.role,
      status: 'Pending' as const,
      submittedAt: new Date().toISOString(),
      payloadHash: `hash-${Date.now()}`,
    };
    db.approvals.unshift(appr);

    return res.status(202).json({
      pendingApproval: true,
      message: `Parts value ($${totalCost.toFixed(2)}) exceeds auto-approve limit of $${db.company.autoApproveLimits.stockIssue}. Request submitted to Approval Inbox.`,
      approval: appr,
    });
  }

  // Auto-approved: update stock and write to append-only ledger
  part.quantityOnHand = Math.max(0, part.quantityOnHand - qty);
  wo.parts.push({
    id: `wop-${Date.now()}`,
    workOrderId: wo.id,
    partId: part.id,
    partName: part.name,
    partSku: part.sku,
    storeId: store.id,
    quantity: qty,
    unitCost: part.standardCost,
    billablePrice: part.billablePrice,
  });

  wo.actualCost += totalCost;
  wo.updatedAt = new Date().toISOString();

  // Ledger write
  const stx: StockTransaction = {
    id: `stx-${Date.now()}`,
    partId: part.id,
    partName: part.name,
    partSku: part.sku,
    storeId: store.id,
    storeName: store.name,
    bin: 'Central-Bin',
    type: 'Issue',
    quantity: -qty,
    unitCost: part.standardCost,
    workOrderId: wo.id,
    reference: `WO-${wo.number} consumption`,
    performedById: actor.id,
    performedByName: actor.name,
    branchId: wo.branchId,
    at: new Date().toISOString(),
  };
  db.stockTransactions.unshift(stx);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'StockTransaction',
    entityId: stx.id,
    entityNumber: stx.reference,
    details: `Issued ${qty}x ${part.name} to ${wo.number}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ workOrder: wo, stockTransaction: stx });
});

apiRouter.post('/work-orders/:id/comments', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const { body, isVisibleToCustomer } = req.body;
  wo.comments.push({
    id: `cm-${Date.now()}`,
    workOrderId: wo.id,
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    body,
    createdAt: new Date().toISOString(),
    isVisibleToCustomer: Boolean(isVisibleToCustomer),
  });

  res.json(wo);
});

apiRouter.post('/work-orders/:id/signature', (req: Request, res: Response) => {
  const actor = getActor(req);
  const wo = db.workOrders.find((w) => w.id === req.params.id);
  if (!wo) return res.status(404).json({ error: 'Work order not found' });

  const { customerSignature, customerRating } = req.body;
  wo.customerSignature = customerSignature;
  if (customerRating) wo.customerRating = Number(customerRating);
  wo.updatedAt = new Date().toISOString();

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Update',
    entityType: 'WorkOrder',
    entityId: wo.id,
    entityNumber: wo.number,
    details: `Recorded customer sign-off signature and rating (${customerRating || 5}/5)`,
    ip: req.ip || '127.0.0.1',
  });

  res.json(wo);
});

// 5. Assets & Meters
apiRouter.get('/assets', (_req: Request, res: Response) => {
  res.json(db.assets);
});

apiRouter.post('/assets', (req: Request, res: Response) => {
  const actor = getActor(req);
  const body = req.body;
  const count = db.assets.length + 1;
  const number = `${db.company.numberPrefixes.asset}${String(count).padStart(6, '0')}`;
  const qrToken = `AST-QR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newAsset = {
    id: `ast-${Date.now()}`,
    number,
    name: body.name,
    tag: body.tag || `TAG-${count}`,
    branchId: body.branchId || actor.branchId || 'br-accra-hq',
    departmentId: body.departmentId || actor.departmentId,
    categoryId: body.categoryId || 'cat-power',
    locationId: body.locationId || 'loc-ridge-site',
    criticality: body.criticality || 'Medium',
    status: body.status || 'Operational',
    make: body.make || 'Standard OEM',
    model: body.model || 'Model V1',
    serialNumber: body.serialNumber || `SN-${Date.now()}`,
    purchaseDate: body.purchaseDate || new Date().toISOString().slice(0, 10),
    purchaseCost: Number(body.purchaseCost || 0),
    warrantyExpiry: body.warrantyExpiry || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    expectedLifeMonths: Number(body.expectedLifeMonths || 120),
    ownerCustomerId: body.ownerCustomerId || null,
    customerSiteId: body.customerSiteId || null,
    qrToken,
    version: 1,
  };

  db.assets.unshift(newAsset);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Asset',
    entityId: newAsset.id,
    entityNumber: newAsset.number,
    details: `Registered asset: ${newAsset.name} [${newAsset.tag}]`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newAsset);
});

apiRouter.post('/assets/:id/meter-readings', (req: Request, res: Response) => {
  const actor = getActor(req);
  const asset = db.assets.find((a) => a.id === req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const { value, unit } = req.body;
  const numVal = Number(value);
  asset.meterReading = numVal;
  if (unit) asset.meterUnit = unit;
  asset.version += 1;

  const reading = {
    id: `mr-${Date.now()}`,
    meterId: `mtr-${asset.id}`,
    assetId: asset.id,
    value: numVal,
    readAt: new Date().toISOString(),
    source: 'Manual' as const,
    recordedById: actor.id,
    recordedByName: actor.name,
  };
  db.meterReadings.unshift(reading);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'MeterReading',
    entityId: reading.id,
    details: `Recorded meter reading ${numVal} for ${asset.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ asset, reading });
});

// 6. Preventive Maintenance (PM)
apiRouter.get('/pm-plans', (_req: Request, res: Response) => {
  res.json({
    plans: db.pmPlans,
    templates: db.checklistTemplates,
  });
});

apiRouter.post('/pm/generate', (req: Request, res: Response) => {
  const actor = getActor(req);
  const generatedOrders: WorkOrder[] = [];

  for (const plan of db.pmPlans.filter((p) => p.isActive)) {
    const template = db.checklistTemplates.find((t) => t.id === plan.checklistTemplateId);
    const asset = db.assets.find((a) => a.id === plan.assetId);

    const count = db.workOrders.length + 1;
    const woNumber = `${db.company.numberPrefixes.workOrder}${String(count).padStart(6, '0')}`;

    const newWo: WorkOrder = {
      id: `wo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      number: woNumber,
      type: 'Preventive',
      title: `${plan.name} (${asset ? asset.name : 'Facility'})`,
      description: `Preventive maintenance schedule executed automatically from template: ${template ? template.name : plan.name}`,
      priority: 'Medium',
      branchId: asset?.branchId || 'br-accra-hq',
      departmentId: asset?.departmentId,
      assetId: plan.assetId,
      locationId: asset?.locationId || 'loc-ridge-site',
      jobKind: 'Internal',
      status: plan.assignedToId ? 'Assigned' : 'Open',
      teamId: plan.teamId,
      assignedToId: plan.assignedToId,
      assignedToName: plan.assignedToId ? db.users.find((u) => u.id === plan.assignedToId)?.name : undefined,
      plannedStart: new Date().toISOString(),
      estimatedHours: template?.estimatedHours || 3.0,
      estimatedCost: 180.0,
      actualCost: 0,
      slaResponseDueAt: new Date(Date.now() + 3600000 * 24).toISOString(),
      slaResolutionDueAt: new Date(Date.now() + 3600000 * 72).toISOString(),
      slaPausedMs: 0,
      slaBreached: false,
      requiresVerification: true,
      tasks: (template?.items || []).map((item, idx) => ({
        id: `wot-${Date.now()}-${idx}`,
        workOrderId: `wo-${Date.now()}`,
        sequence: item.sequence,
        description: item.description,
        type: item.type,
        expectedValue: item.expectedValue,
        isCompleted: false,
      })),
      labor: [],
      parts: [],
      expenses: [],
      comments: [],
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          workOrderId: `wo-${Date.now()}`,
          from: 'Draft',
          to: 'Open',
          changedById: 'system',
          changedByName: 'PM Engine',
          at: new Date().toISOString(),
          note: `Auto-generated from PM Plan: ${plan.name}`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    plan.lastGeneratedAt = new Date().toISOString().slice(0, 10);
    db.workOrders.unshift(newWo);
    generatedOrders.push(newWo);
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'PmGeneration',
    entityId: `pm-batch-${Date.now()}`,
    details: `Triggered PM Generation: created ${generatedOrders.length} preventive work orders`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ count: generatedOrders.length, orders: generatedOrders });
});

// 7. Inventory & Ledger
apiRouter.get('/parts', (_req: Request, res: Response) => {
  res.json(db.parts);
});

apiRouter.get('/stock-transactions', (_req: Request, res: Response) => {
  res.json(db.stockTransactions);
});

apiRouter.post('/stock/receive', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { partId, quantity, storeId, unitCost, reference } = req.body;
  const part = db.parts.find((p) => p.id === partId);
  if (!part) return res.status(404).json({ error: 'Part not found' });

  const qty = Number(quantity || 1);
  const cost = Number(unitCost || part.standardCost);
  const store = db.stores.find((s) => s.id === storeId) || db.stores[0];

  part.quantityOnHand += qty;
  part.version += 1;

  const stx: StockTransaction = {
    id: `stx-${Date.now()}`,
    partId: part.id,
    partName: part.name,
    partSku: part.sku,
    storeId: store.id,
    storeName: store.name,
    bin: 'Central-Bin',
    type: 'Receipt',
    quantity: qty,
    unitCost: cost,
    reference: reference || 'Goods Receipt',
    performedById: actor.id,
    performedByName: actor.name,
    branchId: store.branchId,
    at: new Date().toISOString(),
  };

  db.stockTransactions.unshift(stx);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'StockTransaction',
    entityId: stx.id,
    entityNumber: stx.reference,
    details: `Stock receipt: added ${qty}x ${part.name} to ${store.name}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ part, transaction: stx });
});

// 8. Purchasing
apiRouter.get('/purchasing/orders', (_req: Request, res: Response) => {
  res.json({ orders: db.purchaseOrders, vendors: db.vendors });
});

apiRouter.post('/purchasing/orders', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { vendorId, lines } = req.body;
  const vendor = db.vendors.find((v) => v.id === vendorId);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const count = db.purchaseOrders.length + 1;
  const number = `${db.company.numberPrefixes.purchaseOrder}${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const poLines: PurchaseOrderLine[] = (lines || []).map((l: any, idx: number) => {
    const part = db.parts.find((p) => p.id === l.partId);
    return {
      id: `pol-${Date.now()}-${idx}`,
      partId: l.partId,
      partName: part ? part.name : 'Consumable Item',
      partSku: part ? part.sku : 'SKU-GEN',
      quantity: Number(l.quantity || 1),
      quantityReceived: 0,
      unitCost: Number(l.unitCost || part?.standardCost || 50),
      total: Number(l.quantity || 1) * Number(l.unitCost || part?.standardCost || 50),
    };
  });

  const subtotal = poLines.reduce((sum, l) => sum + l.total, 0);
  const tax = Number((subtotal * 0.15).toFixed(2));
  const total = subtotal + tax;

  const po: PurchaseOrder = {
    id: `po-${Date.now()}`,
    number,
    vendorId: vendor.id,
    vendorName: vendor.name,
    branchId: actor.branchId || 'br-accra-hq',
    departmentId: actor.departmentId,
    status: 'PendingApproval',
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    subtotal,
    tax,
    total,
    lines: poLines,
    makerId: actor.id,
    makerName: actor.name,
    version: 1,
  };

  db.purchaseOrders.unshift(po);

  // Dual control requirement for purchase orders
  db.approvals.unshift({
    id: `appr-${Date.now()}`,
    entityType: 'PurchaseOrder',
    entityId: po.id,
    entityNumber: po.number,
    summary: `Purchase Order Approval: Vendor ${vendor.name} ($${total.toFixed(2)})`,
    amount: total,
    branchId: po.branchId,
    makerId: actor.id,
    makerName: actor.name,
    makerRole: actor.role,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
    payloadHash: `hash-po-${Date.now()}`,
  });

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'PurchaseOrder',
    entityId: po.id,
    entityNumber: po.number,
    details: `Created Purchase Order ${po.number} for ${vendor.name} ($${total.toFixed(2)}) - Submitted to Maker-Checker approval`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(po);
});

// 9. Customers & Contractor Invoicing
apiRouter.get('/customers', (_req: Request, res: Response) => {
  res.json({
    customers: db.customers,
    sites: db.customerSites,
    contacts: db.customerContacts,
    contracts: db.contracts,
  });
});

apiRouter.get('/quotes', (_req: Request, res: Response) => {
  res.json(db.quotes);
});

apiRouter.post('/quotes', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { customerId, siteId, lines } = req.body;
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const count = db.quotes.length + 1;
  const number = `${db.company.numberPrefixes.quote}${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

  const qLines: QuoteLine[] = (lines || []).map((l: any, idx: number) => ({
    id: `ql-${Date.now()}-${idx}`,
    type: l.type || 'Labor',
    description: l.description,
    quantity: Number(l.quantity || 1),
    unitPrice: Number(l.unitPrice || 50),
    total: Number(l.quantity || 1) * Number(l.unitPrice || 50),
  }));

  const subtotal = qLines.reduce((sum, l) => sum + l.total, 0);
  const tax = Number((subtotal * 0.15).toFixed(2));
  const total = subtotal + tax;

  const quote: Quote = {
    id: `quo-${Date.now()}`,
    number,
    customerId: customer.id,
    customerName: customer.name,
    siteId,
    status: 'Sent',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    subtotal,
    tax,
    total,
    approvalToken: `QUO-TOK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    lines: qLines,
    createdAt: new Date().toISOString(),
  };

  db.quotes.unshift(quote);

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Quote',
    entityId: quote.id,
    entityNumber: quote.number,
    details: `Created and sent Quote ${quote.number} to ${customer.name} ($${total.toFixed(2)})`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(quote);
});

apiRouter.get('/invoices', (_req: Request, res: Response) => {
  res.json({ invoices: db.invoices, payments: db.payments });
});

apiRouter.post('/invoices/billing-run', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { customerId, workOrderIds } = req.body;
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const invoiceNumber = db.getNextInvoiceNumber('ACC');
  const selectedWos = db.workOrders.filter((w) => (workOrderIds || []).includes(w.id));

  const lines: InvoiceLine[] = [];

  for (const wo of selectedWos) {
    // Add labor
    const laborTotal = wo.labor.reduce((sum, l) => sum + l.hours * l.billableRate, 0);
    if (laborTotal > 0) {
      lines.push({
        id: `invl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        workOrderId: wo.id,
        type: 'Labor',
        description: `Labor for WO-${wo.number}: ${wo.title}`,
        quantity: 1,
        unitPrice: laborTotal,
        lineTotal: laborTotal,
      });
    }
    // Add parts
    for (const part of wo.parts) {
      lines.push({
        id: `invl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        workOrderId: wo.id,
        type: 'Part',
        description: `${part.partName} (${part.partSku}) for WO-${wo.number}`,
        quantity: part.quantity,
        unitPrice: part.billablePrice,
        lineTotal: part.quantity * part.billablePrice,
      });
    }
  }

  // Fallback if no WO lines
  if (lines.length === 0) {
    lines.push({
      id: `invl-${Date.now()}-fallback`,
      type: 'FixedFee',
      description: 'Scheduled Monthly Facility Maintenance Services',
      quantity: 1,
      unitPrice: 1500.0,
      lineTotal: 1500.0,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const taxTotal = Number((subtotal * 0.15).toFixed(2));
  const total = subtotal + taxTotal;

  // Notice gapless invoice starts in Draft / PendingApproval
  const inv: Invoice = {
    id: `inv-${Date.now()}`,
    number: invoiceNumber,
    customerId: customer.id,
    customerName: customer.name,
    branchId: customer.primaryBranchId || 'br-accra-hq',
    status: 'PendingApproval',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    subtotal,
    taxTotal,
    total,
    amountPaid: 0,
    balance: total,
    lines,
    makerId: actor.id,
    makerName: actor.name,
    version: 1,
  };

  db.invoices.unshift(inv);

  // Dual Control enforcement: Customer invoice must be checked by another finance manager
  db.approvals.unshift({
    id: `appr-${Date.now()}`,
    entityType: 'Invoice',
    entityId: inv.id,
    entityNumber: inv.number,
    summary: `Customer Invoice Issuance: ${customer.name} ($${total.toFixed(2)})`,
    amount: total,
    branchId: inv.branchId,
    makerId: actor.id,
    makerName: actor.name,
    makerRole: actor.role,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
    payloadHash: `hash-inv-${Date.now()}`,
  });

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Invoice',
    entityId: inv.id,
    entityNumber: inv.number,
    details: `Generated gapless invoice ${inv.number} ($${total.toFixed(2)}) - Submitted to Dual-Control checker approval`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(inv);
});

apiRouter.post('/invoices/:id/payment', (req: Request, res: Response) => {
  const actor = getActor(req);
  const inv = db.invoices.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const { amount, method, providerRef } = req.body;
  const payAmount = Number(amount || inv.balance);

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    customerId: inv.customerId,
    customerName: inv.customerName,
    amount: payAmount,
    date: new Date().toISOString().slice(0, 10),
    method: method || 'BankTransfer',
    providerRef: providerRef || `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    branchId: inv.branchId,
    status: 'Approved',
    recordedById: actor.id,
    recordedByName: actor.name,
  };

  db.payments.unshift(payment);

  inv.amountPaid += payAmount;
  inv.balance = Math.max(0, inv.total - inv.amountPaid);
  if (inv.balance === 0) {
    inv.status = 'Paid';
  } else {
    inv.status = 'PartiallyPaid';
  }
  inv.version += 1;

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'Create',
    entityType: 'Payment',
    entityId: payment.id,
    entityNumber: payment.providerRef,
    details: `Processed payment of $${payAmount.toFixed(2)} via ${payment.method} for Invoice ${inv.number}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ invoice: inv, payment });
});

// 10. Dual Control (Maker-Checker) Engine
apiRouter.get('/approvals', (_req: Request, res: Response) => {
  res.json(db.approvals);
});

apiRouter.post('/approvals/:id/decide', (req: Request, res: Response) => {
  const actor = getActor(req);
  const appr = db.approvals.find((a) => a.id === req.params.id);
  if (!appr) return res.status(404).json({ error: 'Approval request not found' });

  const { decision, note } = req.body; // 'Approved' | 'Rejected'

  // CRITICAL RULE 1: Maker CANNOT approve (checkerId !== makerId)!
  if (decision === 'Approved' && appr.makerId === actor.id) {
    return res.status(403).json({
      error: 'Dual Control Violation: The maker who initiated this transaction cannot approve it. A different authorized checker must approve.',
    });
  }

  appr.status = decision;
  appr.checkerId = actor.id;
  appr.checkerName = actor.name;
  appr.decidedAt = new Date().toISOString();
  appr.note = note;

  // Apply real effects only on Approval:
  if (decision === 'Approved') {
    if (appr.entityType === 'Invoice') {
      const inv = db.invoices.find((i) => i.id === appr.entityId);
      if (inv) {
        inv.status = 'Approved';
        inv.checkerId = actor.id;
        inv.checkerName = actor.name;
        inv.approvedAt = new Date().toISOString();
        inv.version += 1;
      }
    } else if (appr.entityType === 'PurchaseOrder') {
      const po = db.purchaseOrders.find((p) => p.id === appr.entityId);
      if (po) {
        po.status = 'Approved';
        po.checkerId = actor.id;
        po.checkerName = actor.name;
        po.version += 1;
      }
    } else if (appr.entityType === 'WorkOrderCost') {
      const wo = db.workOrders.find((w) => w.id === appr.entityId);
      if (wo) {
        wo.status = 'Open';
        wo.statusHistory.push({
          id: `sh-${Date.now()}`,
          workOrderId: wo.id,
          from: 'PendingApproval',
          to: 'Open',
          changedById: actor.id,
          changedByName: actor.name,
          at: new Date().toISOString(),
          note: `Approved by supervisor: ${note || 'Cost approved'}`,
        });
        wo.version += 1;
      }
    }
  }

  db.logActivity({
    actorType: 'User',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: decision === 'Approved' ? 'Approve' : 'Reject',
    entityType: 'ApprovalRequest',
    entityId: appr.id,
    entityNumber: appr.entityNumber,
    details: `${decision} by ${actor.name} (Maker: ${appr.makerName}): ${appr.summary}`,
    ip: req.ip || '127.0.0.1',
  });

  res.json({ approval: appr, success: true });
});

// 11. Tamper-Evident Audit Trail
apiRouter.get('/audit-log', (_req: Request, res: Response) => {
  res.json(db.auditLog);
});

// 12. Public Endpoints (QR Code Scan & Ticket Tracking without login!)
apiRouter.get('/public/track/:token', (req: Request, res: Response) => {
  const reqItem = db.workRequests.find((r) => r.trackingToken === req.params.token);
  if (!reqItem) return res.status(404).json({ error: 'Tracking record not found' });

  const linkedWo = reqItem.convertedWorkOrderId
    ? db.workOrders.find((w) => w.id === reqItem.convertedWorkOrderId)
    : undefined;

  res.json({
    request: reqItem,
    workOrder: linkedWo
      ? {
          number: linkedWo.number,
          status: linkedWo.status,
          priority: linkedWo.priority,
          assignedToName: linkedWo.assignedToName,
          plannedEnd: linkedWo.plannedEnd,
          customerRating: linkedWo.customerRating,
          history: linkedWo.statusHistory,
        }
      : null,
  });
});

apiRouter.post('/public/report', (req: Request, res: Response) => {
  const { title, description, priority, category, assetTag, locationCode, requesterName, requesterPhone, requesterEmail } = req.body;

  const asset = assetTag ? db.assets.find((a) => a.tag === assetTag || a.qrToken === assetTag) : undefined;
  const location = locationCode ? db.locations.find((l) => l.code === locationCode || l.qrToken === locationCode) : undefined;

  const count = db.workRequests.length + 1;
  const num = `${db.company.numberPrefixes.request}${String(count).padStart(6, '0')}`;
  const trackingToken = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const newReq: WorkRequest = {
    id: `req-${Date.now()}`,
    number: num,
    source: 'QR',
    title: title || 'Scanned Fault Report',
    description: description || 'Fault reported via mobile QR label scan',
    priority: priority || 'Medium',
    category: category || 'General Facility',
    branchId: asset?.branchId || location?.branchId || 'br-accra-hq',
    departmentId: asset?.departmentId,
    locationId: asset?.locationId || location?.id,
    assetId: asset?.id,
    requesterName: requesterName || 'Anonymous Guest',
    requesterPhone: requesterPhone || '',
    requesterEmail: requesterEmail || '',
    status: 'Submitted',
    trackingToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  db.workRequests.unshift(newReq);

  db.logActivity({
    actorType: 'Contact',
    actorId: 'public-guest',
    actorName: newReq.requesterName,
    action: 'Create',
    entityType: 'WorkRequest',
    entityId: newReq.id,
    entityNumber: newReq.number,
    details: `Public QR fault submission: "${newReq.title}"`,
    ip: req.ip || '127.0.0.1',
  });

  res.status(201).json(newReq);
});
