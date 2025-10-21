import pg from "pg";
import { getClient } from "./connection.js";

export async function db_initialization() {
	const client = await getClient();

	try {
		console.log("Starting database setup...");
		await client.query(`
            CREATE EXTENSION IF NOT EXISTS vector;
        `);
		// Create ENUM types if they don't exist - improved version
		await client.query(`
        DO $$
            BEGIN
                CREATE TYPE ingredient_category AS ENUM ('fluoride', 'abrasive', 'whitening', 'preservative', 'humectant', 'surfactant', 'binder', 'flavoring');
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN unique_violation THEN null;
            END
        $$;
        `);
		console.log("✓ ingredient_category type ready");

		await client.query(`
        DO $$
            BEGIN
                CREATE TYPE evidence_level_enum AS ENUM ('strong', 'moderate', 'limited', 'insufficient');
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN unique_violation THEN null;
            END
        $$;
        `);
		console.log("✓ evidence_level_enum type ready");

		await client.query(`
        DO $$
            BEGIN
                CREATE TYPE image_type_enum AS ENUM ('package_front', 'ingredients_label', 'barcode', 'tube');
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN unique_violation THEN null;
            END
        $$;
        `);
		console.log("✓ image_type_enum type ready");

		await client.query(`
        DO $$
            BEGIN
                CREATE TYPE analysis_type_enum AS ENUM ('summary', 'safety_breakdown', 'recommendation');
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN unique_violation THEN null;
            END
        $$;
        `);
		console.log("✓ analysis_type_enum type ready");

		await client.query(`
        DO $$
            BEGIN
                CREATE TYPE scan_method_enum AS ENUM ('barcode', 'photo', 'manual_entry');
            EXCEPTION
                WHEN duplicate_object THEN null;
                WHEN unique_violation THEN null;
            END
        $$;
        `);
		console.log("✓ scan_method_enum type ready");

		// Create tables if they don't exist
		await client.query(`
            CREATE TABLE IF NOT EXISTS toothpastes (
                                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(255),
                barcode VARCHAR(50) UNIQUE,
                description TEXT,
                overall_score DECIMAL(3,1),
                score_updated_at TIMESTAMP,
                name_embedding vector(1024),
                is_whitening BOOLEAN DEFAULT false,
                for_sensitive_teeth BOOLEAN DEFAULT false,
                is_fluoride_free BOOLEAN DEFAULT false,
                is_natural BOOLEAN DEFAULT false,
                for_kids BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                );
        `);
		console.log("✓ toothpastes table ready");

		await client.query(`
            CREATE TABLE IF NOT EXISTS ingredients (
                                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL UNIQUE,
                alternative_names TEXT[],
                category ingredient_category,
                benefits TEXT,
                risks TEXT,
                evidence_level evidence_level_enum,
                safety_score DECIMAL(3,1),
                regulatory_notes JSONB,
                content_embedding vector(1024),
                sources TEXT[],
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                );
        `);
		console.log("✓ ingredients table ready");

		await client.query(`
            CREATE TABLE IF NOT EXISTS toothpaste_ingredients (
                                                                  toothpaste_id UUID REFERENCES toothpastes(id) ON DELETE CASCADE,
                ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
                position_in_list INTEGER NOT NULL,
                concentration_percentage DECIMAL(5,2),
                PRIMARY KEY (toothpaste_id, ingredient_id)
                );
        `);
		console.log("✓ toothpaste_ingredients table ready");

		await client.query(`
            CREATE TABLE IF NOT EXISTS images (
                                                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                toothpaste_id UUID REFERENCES toothpastes(id) ON DELETE CASCADE,
                storage_url VARCHAR(500) NOT NULL,
                thumbnail_url VARCHAR(500),
                image_type image_type_enum,
                ocr_text TEXT,
                ocr_confidence DECIMAL(3,2),
                image_embedding vector(512),
                file_size_kb INTEGER,
                width INTEGER,
                height INTEGER,
                uploaded_at TIMESTAMP DEFAULT NOW()
                );
        `);
		console.log("✓ images table ready");

		await client.query(`
            CREATE TABLE IF NOT EXISTS analysis_cache (
                                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                toothpaste_id UUID REFERENCES toothpastes(id) ON DELETE CASCADE,
                analysis_type analysis_type_enum,
                result JSONB NOT NULL,
                embedding vector(1024),
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP,
                UNIQUE (toothpaste_id, analysis_type)
                );
        `);
		console.log("✓ analysis_cache table ready");

		await client.query(`
            CREATE TABLE IF NOT EXISTS scan_events (
                                                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                toothpaste_id UUID REFERENCES toothpastes(id),
                scan_method scan_method_enum,
                session_id UUID,
                country_code VARCHAR(2),
                scanned_at TIMESTAMP DEFAULT NOW()
                );
        `);
		console.log("✓ scan_events table ready");

		// Create indexes if they don't exist
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_toothpastes_brand ON toothpastes(brand);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_toothpastes_barcode ON toothpastes(barcode);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_toothpastes_score ON toothpastes(overall_score DESC);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_toothpastes_filters ON toothpastes(is_whitening, for_sensitive_teeth, is_fluoride_free);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_ingredients_safety_score ON ingredients(safety_score DESC);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_images_toothpaste ON images(toothpaste_id);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup ON analysis_cache(toothpaste_id, analysis_type);`,
		);
		await client.query(
			`CREATE INDEX IF NOT EXISTS idx_analysis_expires ON analysis_cache(expires_at);`,
		);
		console.log("✓ Standard indexes ready");

		// Create vector similarity indexes if they don't exist
		await client.query(`
            CREATE INDEX IF NOT EXISTS idx_toothpastes_name_embedding ON toothpastes
                USING hnsw (name_embedding vector_cosine_ops);
        `);
		await client.query(`
            CREATE INDEX IF NOT EXISTS idx_ingredients_content_embedding ON ingredients
                USING hnsw (content_embedding vector_cosine_ops);
        `);
		await client.query(`
            CREATE INDEX IF NOT EXISTS idx_images_embedding ON images
                USING hnsw (image_embedding vector_cosine_ops);
        `);
		await client.query(`
            CREATE INDEX IF NOT EXISTS idx_analysis_embedding ON analysis_cache
                USING hnsw (embedding vector_cosine_ops);
        `);
		console.log("✓ Vector similarity indexes ready");
		console.log("\n\n\n\n\nDatabase setup completed successfully!");
		console.log("=".repeat(100));
	} catch (error) {
		console.error("Error setting up database:", error);
		throw error;
	} finally {
		client.release();
	}
}
