-- Initialize BukuPay database
-- This script runs once when PostgreSQL container is first created

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search

-- Create test database for integration tests
CREATE DATABASE bukupay_test;
GRANT ALL PRIVILEGES ON DATABASE bukupay_test TO bukupay;
