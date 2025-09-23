# Validation Schemas Directory

This directory contains TypeScript validation schemas using Zod for runtime validation of external data.

## Purpose

- **API Validation**: Request/response validation for REST APIs
- **Import Validation**: Data validation for import operations
- **Type Safety**: Runtime type checking and validation
- **Error Handling**: Detailed validation error messages

## Files

- `api-schemas.ts` - API request/response validation schemas
- `import-schemas.ts` - Import/export data validation schemas

## Usage

These schemas are used to:

- Validate incoming API requests
- Validate data imports (COA templates, journal entries)
- Provide type-safe interfaces
- Generate detailed error messages

## Schema Types

### API Schemas

- Account management (create, update, query)
- Journal entry operations
- Companion links management
- Response formatting

### Import Schemas

- Chart of Accounts templates
- Journal entry imports
- Configuration imports
- Data export requests

## Related

- Database schema is in `../database/` directory
- Domain objects are in `../domain/` directory
- API endpoints use these schemas for validation

## Maintenance

- Keep schemas in sync with API changes
- Add comprehensive error messages
- Test validation edge cases
- Document schema evolution
