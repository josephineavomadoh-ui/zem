/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccessScope = 'Own' | 'Department' | 'Branch' | 'BranchAndBelow' | 'Company';

export type UserRole = 
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Planner'
  | 'Technician'
  | 'Storekeeper'
  | 'Finance'
  | 'Auditor'
  | 'Cashier'
  | 'CustomerContact';

export interface Company {
  id: string;
  name: string;
  legalName: string;
  logo: string;
  baseCurrency: string;
  currencySymbol: string;
  timezone: string;
  locale: string;
  dateFormat: string;
  taxScheme: string;
  taxRate: number;
  fiscalYearStart: string;
  modes: {
    facility: boolean;
    contractor: boolean;
  };
  numberPrefixes: {
    request: string;
    workOrder: string;
    invoice: string;
    purchaseOrder: string;
    quote: string;
    asset: string;
  };
  businessHoursCalendarId: string;
  otpChannel: 'Email' | 'SMS';
  sessionPolicy: {
    maxDurationHours: number;
    idleTimeoutMinutes: number;
  };
  autoApproveLimits: {
    stockIssue: number;
    workOrderCost: number;
    quoteDiscount: number;
  };
}

export interface Branch {
  id: string;
  parentId?: string | null;
  name: string;
  code: string;
  type: 'HeadOffice' | 'Region' | 'Branch' | 'Outlet';
  address: string;
  phone: string;
  managerUserId?: string;
  alternateApproverId?: string;
  invoicePrefix?: string;
  isActive: boolean;
  path: string; // e.g. /1/4/9/
}

export interface Department {
  id: string;
  parentId?: string | null;
  name: string;
  code: string;
  headUserId?: string;
  isActive: boolean;
  path: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leadUserId?: string;
  color?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  departmentId: string;
  accessScope: AccessScope;
  teamIds: string[];
  approvalLimit?: number;
  isActive: boolean;
  avatarUrl?: string;
  locale: string;
  lastLoginAt?: string;
  version: number;
}

export interface Location {
  id: string;
  parentId?: string | null;
  name: string;
  branchId: string;
  type: 'Site' | 'Building' | 'Floor' | 'Room' | 'Area';
  code: string;
  qrToken: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  parentId?: string | null;
  defaultChecklistTemplateId?: string;
}

export type AssetStatus = 'Operational' | 'Degraded' | 'Down' | 'UnderMaintenance' | 'Standby' | 'Retired';
export type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Asset {
  id: string;
  number: string; // e.g. AST-00041
  name: string;
  tag: string; // unique QR identifier
  branchId: string;
  departmentId?: string;
  categoryId: string;
  locationId: string;
  parentAssetId?: string | null;
  criticality: Criticality;
  status: AssetStatus;
  make: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  expectedLifeMonths: number;
  vendorId?: string;
  ownerCustomerId?: string | null; // null = facility mode (own), set = contractor mode
  customerSiteId?: string | null;
  qrToken: string;
  customFields?: Record<string, any>;
  version: number;
  meterReading?: number;
  meterUnit?: string;
}

export interface AssetMeter {
  id: string;
  assetId: string;
  type: string;
  unit: string;
  currentReading: number;
  lastReadingAt: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  assetId: string;
  value: number;
  readAt: string;
  source: 'Manual' | 'Import' | 'Sensor';
  recordedById: string;
  recordedByName?: string;
}

export interface DowntimeLog {
  id: string;
  assetId: string;
  workOrderId?: string;
  start: string;
  end?: string;
  reason: string;
  impact: 'Partial' | 'Full';
}

export type WorkRequestSource = 'Web' | 'QR' | 'Portal' | 'Email' | 'WhatsApp' | 'Phone' | 'Walk-in';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RequestStatus = 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Converted' | 'Cancelled';

export interface WorkRequest {
  id: string;
  number: string;
  source: WorkRequestSource;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  branchId: string;
  departmentId?: string;
  locationId?: string;
  assetId?: string;
  customerId?: string;
  customerSiteId?: string;
  requesterUserId?: string;
  requesterContactId?: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  status: RequestStatus;
  reviewedById?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  convertedWorkOrderId?: string;
  duplicateOfId?: string;
  photoUrl?: string;
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type WorkOrderType = 'Corrective' | 'Preventive' | 'Inspection' | 'Installation' | 'Emergency' | 'Project';
export type JobKind = 'Warranty' | 'Contract' | 'Billable' | 'Internal';
export type WorkOrderStatus = 
  | 'Draft'
  | 'PendingApproval'
  | 'Open'
  | 'Assigned'
  | 'InProgress'
  | 'OnHold'
  | 'Completed'
  | 'Verified'
  | 'Closed'
  | 'Cancelled';

export interface WorkOrderTask {
  id: string;
  workOrderId: string;
  sequence: number;
  description: string;
  type: 'Check' | 'Measure' | 'Text' | 'Photo';
  expectedValue?: string;
  result?: string;
  isCompleted: boolean;
  completedById?: string;
  completedAt?: string;
}

export interface WorkOrderLabor {
  id: string;
  workOrderId: string;
  userId: string;
  userName: string;
  startedAt: string;
  endedAt?: string;
  hours: number;
  rate: number;
  billableRate: number;
  notes?: string;
}

export interface WorkOrderPart {
  id: string;
  workOrderId: string;
  partId: string;
  partName: string;
  partSku: string;
  storeId: string;
  quantity: number;
  unitCost: number;
  billablePrice: number;
}

export interface WorkOrderExpense {
  id: string;
  workOrderId: string;
  description: string;
  amount: number;
  receiptFileId?: string;
  isBillable: boolean;
}

export interface WorkOrderComment {
  id: string;
  workOrderId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
  isVisibleToCustomer: boolean;
}

export interface WorkOrderStatusHistory {
  id: string;
  workOrderId: string;
  from: WorkOrderStatus;
  to: WorkOrderStatus;
  changedById: string;
  changedByName: string;
  at: string;
  note?: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  type: WorkOrderType;
  title: string;
  description: string;
  priority: Priority;
  branchId: string;
  departmentId?: string;
  assetId?: string;
  locationId: string;
  requestId?: string;
  customerId?: string;
  contractId?: string;
  jobKind: JobKind;
  status: WorkOrderStatus;
  holdReason?: string;
  teamId?: string;
  assignedToId?: string;
  assignedToName?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedHours: number;
  estimatedCost: number;
  actualCost: number;
  failureCodeId?: string;
  causeCodeId?: string;
  remedyCodeId?: string;
  slaResponseDueAt?: string;
  slaResolutionDueAt?: string;
  slaRespondedAt?: string;
  slaPausedMs: number;
  slaBreached: boolean;
  requiresVerification: boolean;
  verifiedById?: string;
  customerSignature?: string; // data URL or signature identifier
  customerRating?: number; // 1-5 satisfaction
  tasks: WorkOrderTask[];
  labor: WorkOrderLabor[];
  parts: WorkOrderPart[];
  expenses: WorkOrderExpense[];
  comments: WorkOrderComment[];
  statusHistory: WorkOrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ChecklistItem {
  id: string;
  sequence: number;
  description: string;
  type: 'Check' | 'Measure' | 'Text' | 'Photo';
  expectedValue?: string;
  isRequired: boolean;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  categoryId?: string;
  estimatedHours: number;
  items: ChecklistItem[];
}

export interface PmPlan {
  id: string;
  name: string;
  assetId?: string;
  categoryId?: string;
  checklistTemplateId: string;
  teamId?: string;
  assignedToId?: string;
  trigger: 'Time' | 'Meter' | 'Condition' | 'Seasonal';
  intervalValue: number;
  intervalUnit: 'Days' | 'Weeks' | 'Months';
  meterId?: string;
  meterThreshold?: number;
  leadTimeDays: number;
  startDate: string;
  endDate?: string;
  anchor: 'FixedCalendar' | 'FromCompletion';
  isActive: boolean;
  lastGeneratedAt?: string;
  nextDueDate: string;
}

export interface Store {
  id: string;
  name: string;
  branchId: string;
  locationId: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  unitOfMeasure: string;
  barcode: string;
  standardCost: number;
  markupPercent: number;
  billablePrice: number;
  reorderPoint: number;
  reorderQuantity: number;
  quantityOnHand: number;
  quantityReserved: number;
  preferredVendorId?: string;
  version: number;
}

export type StockTransactionType = 'Receipt' | 'Issue' | 'Return' | 'Transfer' | 'Adjustment' | 'CountCorrection';

export interface StockTransaction {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  storeId: string;
  storeName: string;
  bin: string;
  type: StockTransactionType;
  quantity: number; // signed: positive for receipt, negative for issue
  unitCost: number;
  workOrderId?: string;
  reference: string;
  performedById: string;
  performedByName: string;
  branchId: string;
  at: string;
  approvalId?: string;
}

export interface Customer {
  id: string;
  number: string;
  name: string;
  type: 'Individual' | 'Business';
  email: string;
  phone: string;
  billingAddress: string;
  taxNumber?: string;
  paymentTerms: string; // e.g. "Net 30"
  creditLimit: number;
  accountManagerId?: string;
  primaryBranchId: string;
  isActive: boolean;
  balance: number;
}

export interface CustomerSite {
  id: string;
  customerId: string;
  name: string;
  address: string;
  geo?: string;
  contactPhone: string;
  accessNotes?: string;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  portalEnabled: boolean;
}

export interface ServiceContract {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  type: 'Maintenance' | 'CallOut' | 'Project' | 'Warranty';
  startDate: string;
  endDate: string;
  billingMode: 'Fixed' | 'TimeAndMaterial' | 'Retainer' | 'PerVisit' | 'Warranty';
  fixedAmount?: number;
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annually';
  includedHours?: number;
  usedHours?: number;
  rateCardId?: string;
  autoRenew: boolean;
  status: 'Active' | 'Expired' | 'PendingRenewal' | 'Suspended';
}

export interface QuoteLine {
  id: string;
  type: 'Labor' | 'Part' | 'Expense' | 'Text';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  siteId?: string;
  status: 'Draft' | 'PendingApproval' | 'Released' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';
  validUntil: string;
  subtotal: number;
  tax: number;
  total: number;
  approvalToken: string;
  lines: QuoteLine[];
  convertedWorkOrderId?: string;
  createdAt: string;
}

export interface InvoiceLine {
  id: string;
  workOrderId?: string;
  type: 'Labor' | 'Part' | 'Expense' | 'FixedFee';
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  number: string; // gapless sequence
  customerId: string;
  customerName: string;
  branchId: string;
  contractId?: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Sent' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Void';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  lines: InvoiceLine[];
  makerId: string;
  makerName: string;
  checkerId?: string;
  checkerName?: string;
  approvedAt?: string;
  version: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  method: 'Cash' | 'BankTransfer' | 'MobileMoney' | 'Card' | 'Cheque';
  providerRef?: string;
  branchId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  recordedById: string;
  recordedByName: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  taxNumber?: string;
  category: string;
  rating: number; // 1-5
  paymentTerms: string;
  isActive: boolean;
}

export interface PurchaseOrderLine {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  quantity: number;
  quantityReceived: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  vendorId: string;
  vendorName: string;
  branchId: string;
  departmentId?: string;
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Sent' | 'PartiallyReceived' | 'Received' | 'Cancelled';
  orderDate: string;
  expectedDate: string;
  subtotal: number;
  tax: number;
  total: number;
  lines: PurchaseOrderLine[];
  makerId: string;
  makerName: string;
  checkerId?: string;
  checkerName?: string;
  version: number;
}

export interface ApprovalRequest {
  id: string;
  entityType: 'StockIssue' | 'WorkOrderCost' | 'PurchaseOrder' | 'Invoice' | 'Quote' | 'Payment';
  entityId: string;
  entityNumber: string;
  summary: string;
  amount: number;
  branchId: string;
  departmentId?: string;
  makerId: string;
  makerName: string;
  makerRole: string;
  checkerId?: string;
  checkerName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  submittedAt: string;
  decidedAt?: string;
  note?: string;
  payloadHash: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actorType: 'User' | 'Contact' | 'System' | 'ApiKey';
  actorId: string;
  actorName: string;
  actorRole?: string;
  action: 'Create' | 'Update' | 'StatusChange' | 'Delete' | 'Approve' | 'Reject' | 'Login' | 'Export' | 'View';
  entityType: string;
  entityId: string;
  entityNumber?: string;
  branchId?: string;
  details: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ip: string;
  hash: string;
  previousHash: string;
}
