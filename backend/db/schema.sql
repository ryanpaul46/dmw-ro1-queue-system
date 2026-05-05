-- ============================================================
-- DMW RO1 Queue Management System - Database Schema
-- ============================================================

CREATE DATABASE dmw_queue;

\c dmw_queue;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'staff')),
  division VARCHAR(60),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Counters table
CREATE TABLE counters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  service_id INTEGER REFERENCES services(id),
  status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Queues table
CREATE TABLE queues (
  id SERIAL PRIMARY KEY,
  queue_number INTEGER NOT NULL,
  service_id INTEGER REFERENCES services(id),
  status VARCHAR(10) DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'done')),
  counter_id INTEGER REFERENCES counters(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  served_at TIMESTAMPTZ
);

-- Index for fast queue lookup per service
CREATE INDEX idx_queues_service_status ON queues(service_id, status);

-- ============================================================
-- Seed Data
-- ============================================================

-- Services
INSERT INTO services (name) VALUES
  ('OEC'),
  ('OEC/G2G'),
  ('Direct Hire'),
  ('Information Sheet'),
  ('Reintegration Assistance'),
  ('Legal Assistance');

-- Counters (mapped to services by name)
INSERT INTO counters (name, service_id) VALUES
  ('Counter 1',  (SELECT id FROM services WHERE name = 'OEC')),
  ('Counter 2',  (SELECT id FROM services WHERE name = 'OEC/G2G')),
  ('Counter 3',  (SELECT id FROM services WHERE name = 'Direct Hire')),
  ('Counter 4',  (SELECT id FROM services WHERE name = 'Information Sheet')),
  ('Counter 5',  (SELECT id FROM services WHERE name = 'Direct Hire')),
  ('Counter 6',  (SELECT id FROM services WHERE name = 'Direct Hire')),
  ('Counter 7',  (SELECT id FROM services WHERE name = 'Reintegration Assistance')),
  ('Counter 8',  (SELECT id FROM services WHERE name = 'Reintegration Assistance')),
  ('Counter 9',  (SELECT id FROM services WHERE name = 'Legal Assistance')),
  ('Counter 10', (SELECT id FROM services WHERE name = 'Legal Assistance'));

-- Default admin user (password: admin123)
-- Run this after hashing: bcrypt.hashSync('admin123', 10)
-- Replace the hash below after running: node -e "const b=require('bcryptjs');console.log(b.hashSync('admin123',10))"
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2a$10$4kYvgJciRWwF1LnSeHL98O6kDj6j/jGKNEx6ng7SZEUtqpQU67hRG', 'admin'),
  ('staff1', '$2a$10$4kYvgJciRWwF1LnSeHL98O6kDj6j/jGKNEx6ng7SZEUtqpQU67hRG', 'staff');

-- Note: Default password for both users is 'password'
-- Change passwords immediately in production!
