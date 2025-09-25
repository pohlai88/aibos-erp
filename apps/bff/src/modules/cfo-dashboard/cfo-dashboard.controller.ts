import {
  DrillDownRequestSchema,
  BoardPackExportRequestSchema,
  VarianceAnalysisRequestSchema,
} from '@aibos/accounting-contracts';
import { Controller, Get, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  metadata: {
    tenantId?: string;
    period?: string;
    companyIds?: string[];
    eliminations?: boolean;
    generatedAt: string;
  };
}

@Controller('api/v1/cfo-dashboard')
export class CFODashboardController {
  private static readonly TENANT_ID_REQUIRED = 'tenantId is required';
  private static readonly FAILED_TO_FETCH_KPIS = 'Failed to fetch KPIs';
  private static readonly FAILED_TO_FETCH_COMPANIES = 'Failed to fetch companies';
  private static readonly FAILED_TO_FETCH_CLOSE_READINESS = 'Failed to fetch close readiness';
  private static readonly FAILED_TO_FETCH_CASH_FORECAST = 'Failed to fetch cash forecast';
  private static readonly FAILED_TO_FETCH_DRILL_DOWN = 'Failed to fetch drill-down data';
  private static readonly FAILED_TO_FETCH_VARIANCE_ANALYSIS = 'Failed to fetch variance analysis';
  private static readonly FAILED_TO_GENERATE_BOARD_PACK = 'Failed to generate board pack';
  private static readonly FAILED_TO_CALCULATE_WHAT_IF = 'Failed to calculate what-if scenario';
  private static readonly INTERNAL_SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR;
  private static readonly DEFAULT_REPORT_ID = 'P&L-2024-Q4';
  private static readonly INVALID_REQUEST_DATA = 'Invalid request data';

  // Interface for cash what-if request
  private static readonly CashWhatIfRequest = {
    tenantId: '',
    slowReceipts: 0,
    pushPayables: 0,
    baseScenario: '',
  };

  // Mock data - in production, this would come from your accounting service
  private readonly mockKPIs = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: 'RM 2,450,000',
      raw: 2450000,
      delta: { pct: 12.5, direction: 'up' as const },
      lineage: {
        reportId: CFODashboardController.DEFAULT_REPORT_ID,
        journalIds: ['JE-001', 'JE-002'],
        sourceRefs: ['INV-001', 'INV-002'],
      },
      disclosure: 'MFRS 15',
      sparkline: [2100000, 2200000, 2300000, 2400000, 2450000],
      category: 'revenue' as const,
      priority: 'critical' as const,
      collapsible: true,
      pinned: true,
    },
    {
      id: 'gross-margin',
      title: 'Gross Margin',
      value: '23.4%',
      raw: 23.4,
      delta: { pct: 2.1, direction: 'up' as const },
      lineage: {
        reportId: CFODashboardController.DEFAULT_REPORT_ID,
        journalIds: ['JE-003'],
        sourceRefs: ['COGS-001'],
      },
      disclosure: 'MFRS 2',
      sparkline: [21.2, 21.8, 22.5, 23.1, 23.4],
      category: 'ratios' as const,
      priority: 'high' as const,
      collapsible: true,
    },
    {
      id: 'operating-cash-flow',
      title: 'Operating Cash Flow',
      value: 'RM 680,000',
      raw: 680000,
      delta: { pct: 15.3, direction: 'up' as const },
      lineage: {
        reportId: 'CF-2024-Q4',
        journalIds: ['JE-004', 'JE-005'],
        sourceRefs: ['CASH-001'],
      },
      disclosure: 'MFRS 7',
      sparkline: [580000, 620000, 650000, 670000, 680000],
      category: 'cash' as const,
      priority: 'critical' as const,
      collapsible: true,
      pinned: true,
    },
    {
      id: 'debt-equity-ratio',
      title: 'Debt-to-Equity Ratio',
      value: '0.45',
      raw: 0.45,
      delta: { pct: -5.2, direction: 'down' as const },
      lineage: { reportId: 'BS-2024-Q4', journalIds: ['JE-006'], sourceRefs: ['DEBT-001'] },
      disclosure: 'MFRS 7',
      sparkline: [0.52, 0.5, 0.48, 0.46, 0.45],
      category: 'ratios' as const,
      priority: 'medium' as const,
      collapsible: true,
    },
  ];

  private readonly mockCompanies = [
    {
      id: 'company-001',
      name: 'AIBOS Holdings Sdn Bhd',
      code: 'AH',
      currency: 'MYR',
      status: 'active' as const,
      eliminations: false,
    },
    {
      id: 'company-002',
      name: 'AIBOS Technologies Sdn Bhd',
      code: 'AT',
      currency: 'MYR',
      status: 'active' as const,
      eliminations: false,
    },
    {
      id: 'company-003',
      name: 'AIBOS International Pte Ltd',
      code: 'AI',
      currency: 'SGD',
      status: 'active' as const,
      eliminations: true,
    },
  ];

  private readonly mockCloseReadiness = {
    periodId: '2024-Q4',
    journalsApproved: 45,
    totalJournals: 52,
    lateAdjustments: 3,
    periodLocked: false,
    owner: 'Sarah Chen',
    lastUpdated: new Date(),
    bottlenecks: [
      {
        type: 'journal' as const,
        description: 'JE-048: FX Revaluation pending approval',
        urgency: 'high' as const,
      },
      {
        type: 'reconciliation' as const,
        description: 'Bank reconciliation for USD account',
        urgency: 'medium' as const,
      },
    ],
  };

  private readonly mockCashForecast = {
    period: 'Q1 2025',
    cashRunway: 45,
    riskLevel: 'medium' as const,
    scenarios: [
      { name: 'Optimistic', cashRunway: 65, probability: 0.3 },
      { name: 'Base Case', cashRunway: 45, probability: 0.5 },
      { name: 'Pessimistic', cashRunway: 25, probability: 0.2 },
    ],
    whatIf: {
      slowReceipts: 5,
      pushPayables: -3,
    },
  };

  private readonly mockVarianceStoryline = {
    metricId: 'revenue',
    change: 12.5,
    drivers: [
      {
        type: 'volume' as const,
        impact: 8.2,
        description: 'New product line launch',
        owner: 'Marketing Team',
      },
      {
        type: 'price' as const,
        impact: 3.1,
        description: 'Price increase on premium products',
        owner: 'Sales Team',
      },
      {
        type: 'fx' as const,
        impact: 1.2,
        description: 'USD appreciation vs MYR',
        owner: 'Treasury',
      },
    ],
    attachments: [
      {
        type: 'document' as const,
        name: 'Q4 Sales Analysis.pdf',
        url: '/docs/q4-sales-analysis.pdf',
      },
      { type: 'note' as const, name: 'CEO Comments', url: '/notes/ceo-q4-comments' },
    ],
  };

  /**
   * GET /api/v1/cfo-dashboard/kpis
   * Get KPIs for the outstanding CFO dashboard
   */
  @Get('kpis')
  async getKPIs(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
    @Query('companyIds') companyIds?: string,
    @Query('eliminations') eliminations?: string,
  ): Promise<ApiResponse> {
    try {
      if (!tenantId) {
        throw new HttpException(CFODashboardController.TENANT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      // In production, this would filter KPIs based on companyIds and eliminations
      const filteredKPIs = this.mockKPIs.filter((_kpi) => {
        // Add filtering logic based on companyIds and eliminations
        return true;
      });

      return {
        success: true,
        data: filteredKPIs,
        metadata: {
          tenantId,
          period: period || 'monthly',
          companyIds: companyIds ? companyIds.split(',') : [],
          eliminations: eliminations === 'true',
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_KPIS,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/v1/cfo-dashboard/companies
   * Get companies for multi-company lens
   */
  @Get('companies')
  async getCompanies(@Query('tenantId') tenantId: string): Promise<ApiResponse> {
    try {
      if (!tenantId) {
        throw new HttpException(CFODashboardController.TENANT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        data: this.mockCompanies,
        metadata: {
          tenantId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_COMPANIES,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/v1/cfo-dashboard/close-readiness
   * Get close readiness meter data
   */
  @Get('close-readiness')
  async getCloseReadiness(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
  ): Promise<ApiResponse> {
    try {
      if (!tenantId) {
        throw new HttpException(CFODashboardController.TENANT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        data: this.mockCloseReadiness,
        metadata: {
          tenantId,
          period: period || 'monthly',
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching close readiness:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_CLOSE_READINESS,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/v1/cfo-dashboard/cash-forecast
   * Get 13-week cash early-warning radar data
   */
  @Get('cash-forecast')
  async getCashForecast(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
  ): Promise<ApiResponse> {
    try {
      if (!tenantId) {
        throw new HttpException(CFODashboardController.TENANT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        data: this.mockCashForecast,
        metadata: {
          tenantId,
          period: period || 'monthly',
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching cash forecast:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_CASH_FORECAST,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/v1/cfo-dashboard/drill-down
   * Get drill-down data for a specific metric
   */
  @Post('drill-down')
  async getDrillDown(@Body() body: unknown): Promise<ApiResponse> {
    try {
      const validationResult = DrillDownRequestSchema.safeParse(body);

      if (!validationResult.success) {
        throw new HttpException(
          {
            error: CFODashboardController.INVALID_REQUEST_DATA,
            details: validationResult.error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const { metricId, companyId, tenantId, period } = validationResult.data;

      // Mock drill-down data - in production, this would query your accounting service
      const drillDownData = {
        metricId,
        companyId,
        tenantId,
        period,
        breakdown: [
          { category: 'Product Sales', amount: 1800000, percentage: 73.5 },
          { category: 'Service Revenue', amount: 450000, percentage: 18.4 },
          { category: 'Other Income', amount: 200000, percentage: 8.1 },
        ],
        journalEntries: [
          {
            id: 'JE-001',
            date: '2024-12-15',
            description: 'Product Sales - December',
            amount: 1800000,
          },
          {
            id: 'JE-002',
            date: '2024-12-20',
            description: 'Service Revenue - December',
            amount: 450000,
          },
          {
            id: 'JE-003',
            date: '2024-12-25',
            description: 'Other Income - December',
            amount: 200000,
          },
        ],
        sourceDocuments: [
          { type: 'Invoice', reference: 'INV-001', amount: 1800000, date: '2024-12-15' },
          { type: 'Invoice', reference: 'INV-002', amount: 450000, date: '2024-12-20' },
          { type: 'Receipt', reference: 'RCP-001', amount: 200000, date: '2024-12-25' },
        ],
      };

      return {
        success: true,
        data: drillDownData,
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_DRILL_DOWN,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/v1/cfo-dashboard/variance-analysis
   * Get variance storyline for a specific metric
   */
  @Post('variance-analysis')
  async getVarianceAnalysis(@Body() body: unknown): Promise<ApiResponse> {
    try {
      const validationResult = VarianceAnalysisRequestSchema.safeParse(body);

      if (!validationResult.success) {
        throw new HttpException(
          {
            error: CFODashboardController.INVALID_REQUEST_DATA,
            details: validationResult.error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const { metricId, tenantId, period, companyIds } = validationResult.data;

      // Mock variance analysis - in production, this would analyze actual data
      const varianceAnalysis = {
        metricId,
        tenantId,
        period,
        companyIds: companyIds || [],
        change: 12.5,
        drivers: [
          {
            type: 'volume' as const,
            impact: 8.2,
            description: 'New product line launch',
            owner: 'Marketing Team',
          },
          {
            type: 'price' as const,
            impact: 3.1,
            description: 'Price increase on premium products',
            owner: 'Sales Team',
          },
          {
            type: 'fx' as const,
            impact: 1.2,
            description: 'USD appreciation vs MYR',
            owner: 'Treasury',
          },
        ],
        attachments: [
          {
            type: 'document' as const,
            name: 'Q4 Sales Analysis.pdf',
            url: '/docs/q4-sales-analysis.pdf',
          },
          { type: 'note' as const, name: 'CEO Comments', url: '/notes/ceo-q4-comments' },
        ],
        recommendations: [
          'Continue product line expansion strategy',
          'Monitor FX exposure and consider hedging',
          'Review pricing strategy for premium products',
        ],
      };

      return {
        success: true,
        data: varianceAnalysis,
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching variance analysis:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_FETCH_VARIANCE_ANALYSIS,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/v1/cfo-dashboard/export-board-pack
   * Export board pack with MBRS/XBRL awareness
   */
  @Post('export-board-pack')
  async exportBoardPack(@Body() body: unknown): Promise<ApiResponse> {
    try {
      const validationResult = BoardPackExportRequestSchema.safeParse(body);

      if (!validationResult.success) {
        throw new HttpException(
          {
            error: CFODashboardController.INVALID_REQUEST_DATA,
            details: validationResult.error.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const {
        companyIds,
        period,
        format = 'pdf',
        includeDisclosures = true,
      } = validationResult.data;

      // Mock board pack generation - in production, this would generate actual reports
      const boardPack = {
        id: `board-pack-${Date.now()}`,
        companyIds,
        period,
        format,
        includeDisclosures,
        sections: [
          {
            title: 'Executive Summary',
            content: 'Financial performance overview for the period',
            kpis: this.mockKPIs.filter((kpi) => kpi.priority === 'critical'),
          },
          {
            title: 'Financial Statements',
            content: 'Consolidated P&L, Balance Sheet, and Cash Flow',
            reports: [CFODashboardController.DEFAULT_REPORT_ID, 'BS-2024-Q4', 'CF-2024-Q4'],
          },
          {
            title: 'Variance Analysis',
            content: 'Key variances and explanations',
            variances: this.mockVarianceStoryline,
          },
          {
            title: 'Risk Assessment',
            content: 'Financial risks and mitigation strategies',
            risks: [
              { type: 'FX Risk', level: 'Medium', mitigation: 'Consider hedging strategies' },
              { type: 'Credit Risk', level: 'Low', mitigation: 'Monitor customer credit limits' },
            ],
          },
        ],
        generatedAt: new Date().toISOString(),
        generatedBy: 'CFO Dashboard System',
      };

      return {
        success: true,
        data: boardPack,
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error generating board pack:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_GENERATE_BOARD_PACK,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /api/v1/cfo-dashboard/cash-what-if
   * Recalculate cash forecast with what-if scenarios
   */
  @Post('cash-what-if')
  async calculateCashWhatIf(@Body() body: unknown): Promise<ApiResponse> {
    try {
      // Type assertion for the request body
      const requestBody = body as {
        tenantId?: string;
        slowReceipts?: number;
        pushPayables?: number;
        baseScenario?: string;
      };

      if (!requestBody.tenantId) {
        throw new HttpException(CFODashboardController.TENANT_ID_REQUIRED, HttpStatus.BAD_REQUEST);
      }

      const { tenantId, slowReceipts, pushPayables, baseScenario: _baseScenario } = requestBody;

      // Mock what-if calculation - in production, this would use actual cash flow models
      const baseRunway = this.mockCashForecast.cashRunway;
      const adjustedRunway = baseRunway + (slowReceipts || 0) + (pushPayables || 0);

      const whatIfResult = {
        baseRunway,
        adjustedRunway,
        slowReceipts: slowReceipts || 0,
        pushPayables: pushPayables || 0,
        impact: adjustedRunway - baseRunway,
        riskLevel:
          adjustedRunway < 30
            ? 'critical'
            : adjustedRunway < 45
              ? 'high'
              : adjustedRunway < 60
                ? 'medium'
                : 'low',
        scenarios: [
          { name: 'Optimistic', cashRunway: adjustedRunway + 20, probability: 0.3 },
          { name: 'Base Case', cashRunway: adjustedRunway, probability: 0.5 },
          { name: 'Pessimistic', cashRunway: adjustedRunway - 20, probability: 0.2 },
        ],
      };

      return {
        success: true,
        data: whatIfResult,
        metadata: {
          tenantId,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error calculating what-if scenario:', error);
      throw new HttpException(
        CFODashboardController.FAILED_TO_CALCULATE_WHAT_IF,
        CFODashboardController.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
