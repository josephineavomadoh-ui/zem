/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Company,
  Branch,
  Department,
  Team,
  User,
  Location,
  AssetCategory,
  Asset,
  AssetMeter,
  MeterReading,
  DowntimeLog,
  WorkRequest,
  WorkOrder,
  WorkOrderTask,
  WorkOrderLabor,
  WorkOrderPart,
  WorkOrderExpense,
  WorkOrderComment,
  WorkOrderStatusHistory,
  ChecklistTemplate,
  PmPlan,
  Store,
  Part,
  StockTransaction,
  Customer,
  CustomerSite,
  CustomerContact,
  ServiceContract,
  Quote,
  QuoteLine,
  Invoice,
  InvoiceLine,
  Payment,
  Vendor,
  PurchaseOrder,
  PurchaseOrderLine,
  ApprovalRequest,
  AuditLogEntry,
} from '../types/index.ts';

// Simple crypto hash simulation for tamper-evident audit log
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class ZemiFixDatabase {
  company: Company;
  branches: Branch[] = [];
  departments: Department[] = [];
  teams: Team[] = [];
  users: User[] = [];
  locations: Location[] = [];
  categories: AssetCategory[] = [];
  assets: Asset[] = [];
  meters: AssetMeter[] = [];
  meterReadings: MeterReading[] = [];
  downtimes: DowntimeLog[] = [];
  workRequests: WorkRequest[] = [];
  workOrders: WorkOrder[] = [];
  checklistTemplates: ChecklistTemplate[] = [];
  pmPlans: PmPlan[] = [];
  stores: Store[] = [];
  parts: Part[] = [];
  stockTransactions: StockTransaction[] = [];
  customers: Customer[] = [];
  customerSites: CustomerSite[] = [];
  customerContacts: CustomerContact[] = [];
  contracts: ServiceContract[] = [];
  quotes: Quote[] = [];
  invoices: Invoice[] = [];
  payments: Payment[] = [];
  vendors: Vendor[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  approvals: ApprovalRequest[] = [];
  auditLog: AuditLogEntry[] = [];

  // Gapless invoice counter per branch prefix
  private invoiceCounters: Record<string, number> = {};

  constructor() {
    this.company = {
      id: 'comp-zemifix-01',
      name: 'ZemiFix Engineering & Facilities',
      legalName: 'ZemiFix Technical Services Ltd.',
      logo: '/assets/aistudio/WhatsApp_Image_2026-11-05_at_02.54.33_e1f6d049.jpeg',
      baseCurrency: 'USD',
      currencySymbol: '$',
      timezone: 'UTC',
      locale: 'en-US',
      dateFormat: 'YYYY-MM-DD',
      taxScheme: 'Standard VAT',
      taxRate: 15.0,
      fiscalYearStart: '01-01',
      modes: {
        facility: true,
        contractor: true,
      },
      numberPrefixes: {
        request: 'REQ-',
        workOrder: 'WO-',
        invoice: 'INV-',
        purchaseOrder: 'PO-',
        quote: 'QUO-',
        asset: 'AST-',
      },
      businessHoursCalendarId: 'cal-default',
      otpChannel: 'Email',
      sessionPolicy: {
        maxDurationHours: 8,
        idleTimeoutMinutes: 120,
      },
      autoApproveLimits: {
        stockIssue: 250,
        workOrderCost: 1000,
        quoteDiscount: 5.0,
      },
    };

    this.seedInitialData();
  }

  private seedInitialData() {
    // Branches
    this.branches = [
      {
        id: 'br-accra-hq',
        name: 'Head Office - Accra',
        code: 'ACC-HQ',
        type: 'HeadOffice',
        address: '14 Independence Avenue, Ridge, Accra',
        phone: '+233 30 200 1100',
        managerUserId: 'usr-kwame-boateng',
        alternateApproverId: 'usr-david-osei',
        invoicePrefix: 'ACC',
        isActive: true,
        path: '/br-accra-hq/',
      },
      {
        id: 'br-tema-ind',
        parentId: 'br-accra-hq',
        name: 'Tema Industrial Branch',
        code: 'TEM-01',
        type: 'Branch',
        address: 'Harbour Road, Heavy Industrial Area, Tema',
        phone: '+233 30 300 2200',
        managerUserId: 'usr-kwame-boateng',
        alternateApproverId: 'usr-david-osei',
        invoicePrefix: 'TEM',
        isActive: true,
        path: '/br-accra-hq/br-tema-ind/',
      },
      {
        id: 'br-kumasi-reg',
        parentId: 'br-accra-hq',
        name: 'Kumasi Regional Hub',
        code: 'KMS-02',
        type: 'Region',
        address: 'Adum Commercial Area, Kumasi',
        phone: '+233 32 200 3300',
        managerUserId: 'usr-kwame-boateng',
        alternateApproverId: 'usr-david-osei',
        invoicePrefix: 'KMS',
        isActive: true,
        path: '/br-accra-hq/br-kumasi-reg/',
      },
    ];

    // Departments
    this.departments = [
      {
        id: 'dept-engineering',
        name: 'Engineering & Maintenance',
        code: 'ENG',
        headUserId: 'usr-kwame-boateng',
        isActive: true,
        path: '/dept-engineering/',
      },
      {
        id: 'dept-facilities',
        name: 'Facility Operations',
        code: 'FAC',
        headUserId: 'usr-david-osei',
        isActive: true,
        path: '/dept-facilities/',
      },
      {
        id: 'dept-finance',
        name: 'Finance & Accounts',
        code: 'FIN',
        headUserId: 'usr-francis-ansah',
        isActive: true,
        path: '/dept-finance/',
      },
    ];

    // Teams
    this.teams = [
      {
        id: 'team-hvac',
        name: 'HVAC & Climate Control',
        description: 'Chillers, AHUs, rooftop packages, cooling towers',
        leadUserId: 'usr-kofi-asante',
        color: '#0284c7',
      },
      {
        id: 'team-power',
        name: 'Electrical & Power Systems',
        description: 'Generators, switchgear, transformers, UPS, solar',
        leadUserId: 'usr-kofi-asante',
        color: '#f59e0b',
      },
      {
        id: 'team-plumbing',
        name: 'Plumbing & Water Works',
        description: 'Pumps, water treatment plants, boilers, valves',
        leadUserId: 'usr-akua-addo',
        color: '#10b981',
      },
      {
        id: 'team-civil',
        name: 'Civil & Building Works',
        description: 'Access doors, painting, masonry, general repairs',
        leadUserId: 'usr-akua-addo',
        color: '#8b5cf6',
      },
    ];

    // Users (Key personas with dual control separation)
    this.users = [
      {
        id: 'usr-sarah-mensah',
        name: 'Sarah Mensah',
        email: 'sarah.mensah@zemifix.com',
        phone: '+233 24 100 0001',
        role: 'Admin',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Company',
        teamIds: [],
        approvalLimit: 100000,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-kwame-boateng',
        name: 'Kwame Boateng',
        email: 'kwame.boateng@zemifix.com',
        phone: '+233 24 100 0002',
        role: 'Manager',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Company',
        teamIds: [],
        approvalLimit: 50000,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-david-osei',
        name: 'David Osei',
        email: 'david.osei@zemifix.com',
        phone: '+233 24 100 0003',
        role: 'Supervisor',
        branchId: 'br-accra-hq',
        departmentId: 'dept-facilities',
        accessScope: 'BranchAndBelow',
        teamIds: ['team-hvac', 'team-power'],
        approvalLimit: 10000,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-emmanuel-darko',
        name: 'Emmanuel Darko',
        email: 'emmanuel.darko@zemifix.com',
        phone: '+233 24 100 0004',
        role: 'Planner',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Branch',
        teamIds: [],
        approvalLimit: 2500,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-kofi-asante',
        name: 'Kofi Asante',
        email: 'kofi.asante@zemifix.com',
        phone: '+233 24 100 0005',
        role: 'Technician',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Own',
        teamIds: ['team-hvac', 'team-power'],
        approvalLimit: 500,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-akua-addo',
        name: 'Akua Addo',
        email: 'akua.addo@zemifix.com',
        phone: '+233 24 100 0006',
        role: 'Technician',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Own',
        teamIds: ['team-plumbing', 'team-civil'],
        approvalLimit: 500,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-grace-appiah',
        name: 'Grace Appiah',
        email: 'grace.appiah@zemifix.com',
        phone: '+233 24 100 0007',
        role: 'Storekeeper',
        branchId: 'br-accra-hq',
        departmentId: 'dept-engineering',
        accessScope: 'Branch',
        teamIds: [],
        approvalLimit: 2000,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-francis-ansah',
        name: 'Francis Ansah',
        email: 'francis.ansah@zemifix.com',
        phone: '+233 24 100 0008',
        role: 'Finance',
        branchId: 'br-accra-hq',
        departmentId: 'dept-finance',
        accessScope: 'Company',
        teamIds: [],
        approvalLimit: 75000,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
      {
        id: 'usr-cynthia-kwarteng',
        name: 'Cynthia Kwarteng',
        email: 'cynthia.kwarteng@zemifix.com',
        phone: '+233 24 100 0009',
        role: 'Auditor',
        branchId: 'br-accra-hq',
        departmentId: 'dept-finance',
        accessScope: 'Company',
        teamIds: [],
        approvalLimit: 0,
        isActive: true,
        locale: 'en-US',
        version: 1,
      },
    ];

    // Categories and Stores are kept as configuration
    this.categories = [
      { id: 'cat-power', name: 'Power Generation & UPS', code: 'PWR' },
      { id: 'cat-hvac', name: 'HVAC & Chillers', code: 'HVAC' },
      { id: 'cat-plumbing', name: 'Water & Fluid Systems', code: 'PLUMB' },
      { id: 'cat-transport', name: 'Elevators & Escalators', code: 'VERT' },
      { id: 'cat-safety', name: 'Fire Protection & Security', code: 'FIRE' },
    ];

    this.stores = [
      {
        id: 'str-accra-central',
        branchId: 'br-accra-hq',
        name: 'Central Engineering Warehouse',
        locationId: 'loc-accra-main',
        isActive: true,
      },
      {
        id: 'str-tema-depot',
        branchId: 'br-tema-ind',
        name: 'Tema Heavy Industrial Store',
        locationId: 'loc-tema-main',
        isActive: true,
      },
    ];

    // Initial clean empty arrays for real operational testing
    this.locations = [];
    this.assets = [];
    this.meters = [];
    this.meterReadings = [];
    this.downtimes = [];
    this.parts = [];
    this.stockTransactions = [];
    this.checklistTemplates = [];
    this.pmPlans = [];
    this.customers = [];
    this.customerSites = [];
    this.customerContacts = [];
    this.contracts = [];
    this.quotes = [];
    this.workRequests = [];
    this.workOrders = [];
    this.approvals = [];
    this.invoices = [];
    this.payments = [];
    this.vendors = [];
    this.purchaseOrders = [];

    // Seed Audit Log
    this.logActivity({
      actorType: 'System',
      actorId: 'sys-init',
      actorName: 'System Bootstrapper',
      action: 'Create',
      entityType: 'Company',
      entityId: this.company.id,
      entityNumber: 'ZEMIFIX-CORP',
      details: 'ZemiFix single company deployment initialized with dual-control governance',
      ip: '127.0.0.1',
    });
  }

  // Next gapless invoice sequence per branch prefix
  public getNextInvoiceNumber(branchPrefix = 'ACC'): string {
    const year = new Date().getFullYear();
    const key = `${branchPrefix}-${year}`;
    this.invoiceCounters[key] = (this.invoiceCounters[key] || 104) + 1;
    const num = String(this.invoiceCounters[key]).padStart(5, '0');
    return `INV-${branchPrefix}-${year}-${num}`;
  }

  // Append-only tamper-evident audit log
  public logActivity(entry: Omit<AuditLogEntry, 'id' | 'at' | 'hash' | 'previousHash'>): AuditLogEntry {
    const lastEntry = this.auditLog[this.auditLog.length - 1];
    const previousHash = lastEntry ? lastEntry.hash : '00000000';
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const at = new Date().toISOString();
    const raw = `${id}:${at}:${entry.actorId}:${entry.action}:${entry.entityType}:${entry.entityId}:${previousHash}`;
    const hash = simpleHash(raw);

    const fullEntry: AuditLogEntry = {
      ...entry,
      id,
      at,
      hash,
      previousHash,
    };

    this.auditLog.push(fullEntry);
    return fullEntry;
  }
}

// Global database instance
export const db = new ZemiFixDatabase();
