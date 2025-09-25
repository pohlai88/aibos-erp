import type { Request, Response, NextFunction } from 'express';

import { z } from 'zod';

// Validation schemas for API requests
const CreateAccountSchema = z.object({
  accountCode: z.string().min(1).max(50),
  accountName: z.string().min(1).max(255),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentAccountCode: z.string().optional(),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  naturalBalance: z.enum(['DEBIT', 'CREDIT']).optional(),
});

const JournalEntryLineSchema = z.object({
  accountCode: z.string().min(1),
  debitAmount: z.number().min(0).optional(),
  creditAmount: z.number().min(0).optional(),
  description: z.string().optional(),
});

const PostJournalEntrySchema = z.object({
  journalEntryId: z.string().min(1),
  entries: z.array(JournalEntryLineSchema).min(1),
  reference: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  postedBy: z.string().min(1),
  postingDate: z.string().datetime().optional(),
  book: z.string().optional(),
  accountingPeriod: z.string().min(1),
  periodStatus: z.enum(['OPEN', 'CLOSED', 'LOCKED', 'FINALIZED']),
  isAdjustingEntry: z.boolean().default(false),
  isClosingEntry: z.boolean().default(false),
  isReversingEntry: z.boolean().default(false),
  currencyCode: z.string().length(3).default('MYR'),
  baseCurrencyCode: z.string().length(3).default('MYR'),
  exchangeRate: z.number().positive().optional(),
  exchangeRateDate: z.string().datetime().optional(),
  isFXRevaluation: z.boolean().default(false),
  taxLines: z
    .array(
      z.object({
        taxCode: z.string(),
        taxAmount: z.number(),
        jurisdiction: z.string(),
        isRecoverable: z.boolean(),
        taxType: z.enum(['INPUT', 'OUTPUT', 'REVERSE_CHARGE']),
      }),
    )
    .default([]),
  totalTaxAmount: z.number().min(0).default(0),
  reportingStandard: z.enum(['MFRS', 'IFRS', 'GAAP', 'LOCAL']).default('MFRS'),
  countryCode: z.enum(['MY', 'SG', 'VN', 'ID', 'TH', 'PH']).default('MY'),
  industryType: z
    .enum(['GENERAL', 'MANUFACTURING', 'RETAIL', 'SERVICES', 'NON_PROFIT', 'REAL_ESTATE'])
    .default('GENERAL'),
  fiscalYear: z.number().int().min(2000).max(2100),
  approval: z
    .object({
      required: z.boolean(),
      approvedBy: z.string().optional(),
      approvalDate: z.string().datetime().optional(),
      approvalLevel: z.enum(['AUTO', 'MANAGER', 'CONTROLLER', 'CFO', 'AUDIT_COMMITTEE']),
      approvalLimit: z.number().min(0),
      requiresExplanation: z.boolean(),
      explanation: z.string().optional(),
    })
    .default({
      required: false,
      approvalLevel: 'AUTO',
      approvalLimit: 0,
      requiresExplanation: false,
    }),
  supportingDocuments: z
    .array(
      z.object({
        documentId: z.string(),
        documentType: z.enum([
          'INVOICE',
          'RECEIPT',
          'CONTRACT',
          'BANK_STATEMENT',
          'PAYMENT_VOUCHER',
        ]),
        documentNumber: z.string(),
        amount: z.number(),
        currency: z.string(),
        issueDate: z.string().datetime(),
        isVerified: z.boolean(),
      }),
    )
    .default([]),
});

const ReverseJournalEntrySchema = z.object({
  reason: z.string().min(1).max(500),
  reversedBy: z.string().min(1),
});

const ReconciliationSchema = z.object({
  expectedBalances: z.record(z.string(), z.number()).optional(),
});

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((error_) => ({
            field: error_.path.join('.'),
            message: error_.message,
            code: error_.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// Specific validation middlewares
export const validateCreateAccount = createValidationMiddleware(CreateAccountSchema);
export const validatePostJournalEntry = createValidationMiddleware(PostJournalEntrySchema);
export const validateReverseJournalEntry = createValidationMiddleware(ReverseJournalEntrySchema);
export const validateReconciliation = createValidationMiddleware(ReconciliationSchema);

// Query parameter validation
export function validateQueryParameters(req: Request, res: Response, next: NextFunction): void {
  const { asOfDate, currencyCode } = req.query;

  if (asOfDate && isNaN(Date.parse(asOfDate as string))) {
    res.status(400).json({
      success: false,
      message: 'Invalid asOfDate format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    });
    return;
  }

  if (currencyCode && typeof currencyCode === 'string' && currencyCode.length !== 3) {
    res.status(400).json({
      success: false,
      message: 'Invalid currencyCode format. Use 3-letter ISO currency code (e.g., MYR, USD)',
    });
    return;
  }

  next();
}

// Error handling middleware
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Accounting API Error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(
      `${new Date().toISOString()} - ${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`,
    );
  });

  next();
}
