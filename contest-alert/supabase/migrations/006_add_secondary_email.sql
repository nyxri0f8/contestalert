-- Migration: 006_add_secondary_email.sql
-- Add secondary_email column to profiles table for backup email address

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS secondary_email TEXT;
