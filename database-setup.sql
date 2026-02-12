-- Anonymous Voice Communication Platform - Database Setup
-- PostgreSQL Database Initialization Script

-- Create database (run as postgres user)
CREATE DATABASE voice_platform_db;

-- Connect to the database
\c voice_platform_db;

-- The tables will be automatically created by Hibernate/JPA
-- based on the entity classes when the application starts.

-- However, here's the equivalent SQL for reference:

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    anonymous_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(255) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    customer_id BIGINT,
    registered_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_id VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    customer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    assigned_agent_id BIGINT,
    assigned_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    caller_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration BIGINT,
    was_successful BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (caller_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_customer_id ON products(customer_id);
CREATE INDEX idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_assigned_agent_id ON tickets(assigned_agent_id);
CREATE INDEX idx_call_logs_ticket_id ON call_logs(ticket_id);
CREATE INDEX idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX idx_call_logs_receiver_id ON call_logs(receiver_id);

-- Sample data for testing

-- Insert sample users (passwords are hashed with BCrypt for 'password123')
INSERT INTO users (username, email, password, role, anonymous_id) VALUES
('admin_user', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'ADMIN-12345678'),
('agent_john', 'john@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'COMPANY_AGENT', 'AGENT-87654321'),
('customer_alice', 'alice@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER', 'CUST-11223344');

-- Insert sample product
INSERT INTO products (product_id, product_name, description, customer_id, registered_at) VALUES
('PROD-2024-001', 'Enterprise Software License', 'Annual subscription for enterprise software', 3, CURRENT_TIMESTAMP);

-- Insert sample ticket
INSERT INTO tickets (ticket_id, subject, description, customer_id, product_id, status) VALUES
('TICK-20240124-0001', 'Installation Issue', 'Unable to install the software on Windows 11', 3, 1, 'ACTIVE');

-- Update ticket to assign to agent
UPDATE tickets SET assigned_agent_id = 2, assigned_at = CURRENT_TIMESTAMP, status = 'IN_PROGRESS' WHERE ticket_id = 'TICK-20240124-0001';

-- Verification queries
SELECT 'Users:' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Products:', count(*) FROM products
UNION ALL
SELECT 'Tickets:', count(*) FROM tickets;

-- Display sample data
SELECT u.username, u.role, u.anonymous_id 
FROM users u 
ORDER BY u.role, u.username;

SELECT t.ticket_id, t.subject, t.status, 
       c.anonymous_id as customer, 
       a.anonymous_id as agent
FROM tickets t
JOIN users c ON t.customer_id = c.id
LEFT JOIN users a ON t.assigned_agent_id = a.id;
