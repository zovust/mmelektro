-- Create tables for fan diagnosis system
CREATE DATABASE sistem_diagnosa_kipas;
USE sistem_diagnosa_kipas;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Damages table
CREATE TABLE kerusakan (
    id VARCHAR(10) PRIMARY KEY,
    nama_kerusakan VARCHAR(100) NOT NULL,
    solusi TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Symptoms table
CREATE TABLE gejala (
    id VARCHAR(10) PRIMARY KEY,
    nama_gejala VARCHAR(200) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Diagnosis rules table
CREATE TABLE aturan_diagnosa (
    id SERIAL PRIMARY KEY,
    id_gejala VARCHAR(10) NOT NULL REFERENCES gejala(id) ON DELETE CASCADE,
    id_kerusakan VARCHAR(10) NOT NULL REFERENCES kerusakan(id) ON DELETE CASCADE,
    probabilitas DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_gejala, id_kerusakan)
);

-- Diagnosis history table
CREATE TABLE riwayat_diagnosa (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gejala TEXT,
    hasil JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    catatan TEXT
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kerusakan_updated_at
    BEFORE UPDATE ON kerusakan
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gejala_updated_at
    BEFORE UPDATE ON gejala
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aturan_diagnosa_updated_at
    BEFORE UPDATE ON aturan_diagnosa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO kerusakan (id, nama_kerusakan, solusi) VALUES
('K1', 'Dinamo', 'Pergantian Dinamo'),
('K2', 'Kapasitor', 'Pergantian Kapasitor'),
('K3', 'AS dan Bearing', 'Pergantian Unit'),
('K4', 'Kabel putus', 'Service Kabel'),
('K5', 'Sekring', 'Pergantian Sekring');

INSERT INTO gejala (id, nama_gejala, deskripsi) VALUES
('G1', 'Kipas Berputar Lambat', 'Kipas berputar dengan kecepatan lebih lambat dari normal'),
('G2', 'Mesin Berdengung', 'Terdengar suara dengung dari mesin kipas'),
('G3', 'Putaran Dinamo Melambat', 'Dinamo berputar lebih lambat dari biasanya'),
('G4', 'Bau Terbakar Pada Dinamo', 'Tercium bau seperti terbakar dari area dinamo'),
('G5', 'Dinamo Cepat Panas', 'Dinamo menjadi panas dalam waktu singkat'),
('G6', 'Tidak Gerak Kanan - Kiri', 'Kipas tidak dapat bergerak ke kanan atau kiri'),
('G7', 'Keluar Asap', 'Terlihat asap keluar dari kipas'),
('G8', 'Indikator Menyala tapi Kipas Tidak Bereaksi', 'Lampu indikator menyala namun kipas tidak berputar'),
('G9', 'Mati Total', 'Kipas sama sekali tidak merespon'),
('G10', 'Kipas Tidak Berputar', 'Kipas dalam kondisi hidup namun tidak berputar'),
('G11', 'Salah Satu Speed Mati', 'Salah satu kecepatan kipas tidak berfungsi');

INSERT INTO aturan_diagnosa (id_gejala, id_kerusakan, probabilitas) VALUES
('G1', 'K1', 0.00), ('G1', 'K2', 1.00), ('G1', 'K3', 1.00), ('G1', 'K4', 0.00), ('G1', 'K5', 0.00),
('G2', 'K1', 1.00), ('G2', 'K2', 0.00), ('G2', 'K3', 1.00), ('G2', 'K4', 0.00), ('G2', 'K5', 0.00),
('G3', 'K1', 1.00), ('G3', 'K2', 0.00), ('G3', 'K3', 0.00), ('G3', 'K4', 0.00), ('G3', 'K5', 0.00),
('G4', 'K1', 1.00), ('G4', 'K2', 1.00), ('G4', 'K3', 0.00), ('G4', 'K4', 0.00), ('G4', 'K5', 0.00),
('G5', 'K1', 1.00), ('G5', 'K2', 1.00), ('G5', 'K3', 0.00), ('G5', 'K4', 0.00), ('G5', 'K5', 0.00),
('G6', 'K1', 1.00), ('G6', 'K2', 1.00), ('G6', 'K3', 1.00), ('G6', 'K4', 0.00), ('G6', 'K5', 0.00),
('G7', 'K1', 0.00), ('G7', 'K2', 0.00), ('G7', 'K3', 0.00), ('G7', 'K4', 1.00), ('G7', 'K5', 1.00),
('G8', 'K1', 0.00), ('G8', 'K2', 1.00), ('G8', 'K3', 0.00), ('G8', 'K4', 1.00), ('G8', 'K5', 1.00),
('G9', 'K1', 0.00), ('G9', 'K2', 0.00), ('G9', 'K3', 0.00), ('G9', 'K4', 1.00), ('G9', 'K5', 1.00),
('G10', 'K1', 0.00), ('G10', 'K2', 0.00), ('G10', 'K3', 1.00), ('G10', 'K4', 1.00), ('G10', 'K5', 1.00),
('G11', 'K1', 1.00), ('G11', 'K2', 1.00), ('G11', 'K3', 0.00), ('G11', 'K4', 1.00), ('G11', 'K5', 0.00);

-- Create default admin user (password: admin123)
INSERT INTO users (username, password, email, nama_lengkap, role) VALUES
('admin', '$2a$12$6n8IobgL8lUZkcaI22nGvO/vt6qjvBLbpKpkRXR9OZ4qz9m5M7TL2', 'admin@mmelektro.com', 'Administrator', 'admin'); 