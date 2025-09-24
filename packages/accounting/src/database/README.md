# Database Schema Directory

This directory contains database schema definitions and migration scripts for the accounting module.

## Purpose

- **Database Schema**: SQL DDL statements for creating database tables
- **Migration Scripts**: Database versioning and migration files

## Files

- `standards-schema.sql` - Database schema for standards compliance tracking

## Usage

These SQL files are used to:

- Create database tables for accounting operations
- Manage Chart of Accounts templates
- Audit compliance changes

## Related

- Validation schemas are in `../validation/` directory
- Domain objects are in `../domain/` directory
- Services are in `../services/` directory

## Maintenance

- Database schema changes should be versioned
- Migration scripts should be created for schema updates
- Test data should be separate from schema definitions
