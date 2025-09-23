-- Standards Compliance Schema for MFRS/IFRS Accounting
-- This schema enables comprehensive standards tracking and audit trails

-- Standards master table (MFRS, IFRS, local standards)
CREATE TABLE ref_standard (
    standard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,                    -- 'MFRS', 'IFRS', 'MFRS 116', etc.
    name TEXT NOT NULL,                    -- 'Malaysian Financial Reporting Standards'
    version TEXT NOT NULL,                 -- '2024.09'
    jurisdiction TEXT,                     -- 'MY', 'SG', 'TH', 'VN', 'GLOBAL'
    effective_date DATE,
    superseded_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (code, version)
);

-- Standard sections/paragraphs for detailed referencing
CREATE TABLE ref_standard_section (
    section_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id UUID NOT NULL REFERENCES ref_standard(standard_id) ON DELETE CASCADE,
    section_code TEXT NOT NULL,            -- e.g. 'MFRS 116:Recognition'
    title TEXT NOT NULL,                   -- 'Property, Plant and Equipment: Recognition'
    description TEXT,                      -- Detailed description of the section
    paragraphs TEXT[],                     -- e.g. ['7','16','30'] or ranges like ['59-64']
    effective_date DATE,
    superseded_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (standard_id, section_code)
);

-- Crosswalk between standards (MFRS ↔ IFRS equivalence)
CREATE TABLE ref_standard_crosswalk (
    from_section_id UUID NOT NULL REFERENCES ref_standard_section(section_id) ON DELETE CASCADE,
    to_section_id UUID NOT NULL REFERENCES ref_standard_section(section_id) ON DELETE CASCADE,
    relation TEXT NOT NULL CHECK (relation IN ('equivalent', 'broader', 'narrower', 'related', 'supersedes')),
    confidence_score DECIMAL(3,2) DEFAULT 1.0,  -- 0.0 to 1.0 confidence in mapping
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (from_section_id, to_section_id)
);

-- Template versions for COA bundles
CREATE TABLE coa_template (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                    -- 'MFRS 2024.09', 'IFRS 2024.09'
    version TEXT NOT NULL,                 -- '2024.09'
    jurisdiction TEXT NOT NULL,            -- 'MY', 'SG', 'TH', 'VN', 'GLOBAL'
    description TEXT,
    is_default BOOLEAN DEFAULT false,      -- Default template for new tenants
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (name, version)
);

-- Template account definitions (YAML/JSON content)
CREATE TABLE coa_template_account (
    template_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES coa_template(template_id) ON DELETE CASCADE,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,            -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
    parent_code TEXT,                      -- Parent account code
    posting_allowed BOOLEAN DEFAULT true,
    special_account_type TEXT,             -- Matches SpecialAccountType enum
    companions JSONB,                      -- Companion account relationships
    standard_refs JSONB,                   -- Array of standard references
    notes TEXT,
    tags TEXT[],                           -- Searchable tags
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (template_id, account_code)
);

-- Tenant-specific COA with standards tracking
CREATE TABLE tenant_coa (
    coa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    parent_code TEXT,
    posting_allowed BOOLEAN DEFAULT true,
    special_account_type TEXT,
    companions JSONB,
    template_origin TEXT,                  -- 'mfrs/2024.09'
    template_diff JSONB,                   -- User customizations
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, account_code)
);

-- Links between tenant COA accounts and standard sections
CREATE TABLE tenant_coa_standard_link (
    coa_id UUID NOT NULL REFERENCES tenant_coa(coa_id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES ref_standard_section(section_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,      -- Primary standard for this account
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (coa_id, section_id)
);

-- Standards compliance audit log
CREATE TABLE standards_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_code TEXT NOT NULL,
    action TEXT NOT NULL,                  -- 'created', 'updated', 'standards_added', 'standards_removed'
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ref_standard_code_version ON ref_standard(code, version);
CREATE INDEX idx_ref_standard_section_standard ON ref_standard_section(standard_id);
CREATE INDEX idx_ref_standard_section_code ON ref_standard_section(section_code);
CREATE INDEX idx_coa_template_jurisdiction ON coa_template(jurisdiction, is_default);
CREATE INDEX idx_tenant_coa_tenant ON tenant_coa(tenant_id);
CREATE INDEX idx_tenant_coa_code ON tenant_coa(account_code);
CREATE INDEX idx_tenant_coa_standard_link_coa ON tenant_coa_standard_link(coa_id);
CREATE INDEX idx_standards_audit_tenant ON standards_audit_log(tenant_id);
CREATE INDEX idx_standards_audit_account ON standards_audit_log(account_code);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ref_standard_updated_at BEFORE UPDATE ON ref_standard
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ref_standard_section_updated_at BEFORE UPDATE ON ref_standard_section
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coa_template_updated_at BEFORE UPDATE ON coa_template
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coa_template_account_updated_at BEFORE UPDATE ON coa_template_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_coa_updated_at BEFORE UPDATE ON tenant_coa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
