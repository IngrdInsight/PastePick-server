import pg from "pg";
import { getClient } from "./connection.js";

export async function db_initialization() {
	/*	const client = await getClient();

	try {
		console.log("Starting database cleanup and setup...");

		// Drop all tables (cascades will handle dependencies)
		await client.query(`DROP TABLE IF EXISTS toothpaste_ingredients CASCADE;`);
		await client.query(`DROP TABLE IF EXISTS ingredients CASCADE;`);
		await client.query(`DROP TABLE IF EXISTS toothpastes CASCADE;`);
		console.log("✓ Existing tables dropped");

		// Drop all ENUM types
		await client.query(`DROP TYPE IF EXISTS ingredient_category CASCADE;`);
		await client.query(`DROP TYPE IF EXISTS evidence_level_enum CASCADE;`);
		await client.query(`DROP TYPE IF EXISTS image_type_enum CASCADE;`);
		console.log("✓ Existing ENUM types dropped");

		// Create vector extension
		await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
		console.log("✓ Vector extension ready");



		await client.query(`
			CREATE TYPE evidence_level_enum AS ENUM ('high', 'moderate', 'low', 'limited');
		`);
		console.log("✓ evidence_level_enum type created");

		// Create toothpastes table
		await client.query(`
			CREATE TABLE toothpastes (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL,
				brand VARCHAR(255),
				description TEXT,
				image_url VARCHAR(500) NOT NULL,
				overall_score DECIMAL(3,1),
				score_updated_at TIMESTAMP,
				name_embedding vector(3072),
				is_whitening BOOLEAN DEFAULT false,
				for_sensitive_teeth BOOLEAN DEFAULT false,
				is_fluoride_free BOOLEAN DEFAULT false,
				is_natural BOOLEAN DEFAULT false,
				for_kids BOOLEAN DEFAULT false,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			);
		`);
		console.log("✓ toothpastes table created");

		// Create ingredients table with additional fields from your JSON
		await client.query(`
			CREATE TABLE ingredients (
				id SERIAL PRIMARY KEY,
				name VARCHAR(255) NOT NULL UNIQUE,
				alternative_names TEXT[],
				category VARCHAR(128),
				benefits TEXT,
				risks TEXT,
				evidence_level evidence_level_enum,
				labeling_echa TEXT,
				safety_score DECIMAL(3,1),
				regulatory_notes TEXT,
				link_echa VARCHAR(500),
				link_cosing VARCHAR(500),
				link_pubchem VARCHAR(500),
				link_other VARCHAR(500),
				name_embedding vector(3072),
				alternative_name_embedding vector(3072),
				sources TEXT[],
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			);
		`);
		console.log("✓ ingredients table created");

		// Create junction table
		await client.query(`
			CREATE TABLE toothpaste_ingredients (
				toothpaste_id INTEGER REFERENCES toothpastes(id) ON DELETE CASCADE,
				ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
				concentration_percentage DECIMAL(5,2),
				PRIMARY KEY (toothpaste_id, ingredient_id)
			);
		`);
		console.log("✓ toothpaste_ingredients table created");

		// Create standard indexes
		await client.query(`CREATE INDEX idx_toothpastes_brand ON toothpastes(brand);`);
		await client.query(`CREATE INDEX idx_toothpastes_score ON toothpastes(overall_score DESC);`);
		await client.query(`CREATE INDEX idx_toothpastes_filters ON toothpastes(is_whitening, for_sensitive_teeth, is_fluoride_free);`);
		await client.query(`CREATE INDEX idx_ingredients_category ON ingredients(category);`);
		await client.query(`CREATE INDEX idx_ingredients_safety_score ON ingredients(safety_score DESC);`);
		console.log("✓ Standard indexes created");

		// Create vector similarity indexes

		//await client.query(`
		//	CREATE INDEX idx_toothpastes_name_embedding ON toothpastes
		//	USING hnsw (name_embedding vector_cosine_ops);
		//`);
		//await client.query(`
		//	CREATE INDEX idx_ingredients_name_embedding ON ingredients
		//	USING hnsw (name_embedding vector_cosine_ops);
		//`);
		//await client.query(`
		//	CREATE INDEX idx_ingredients_alternative_name_embedding ON ingredients
		//	USING hnsw (alternative_name_embedding vector_cosine_ops);
		//`);
		//console.log("✓ Vector similarity indexes created");



		console.log("\n" + "=".repeat(100));
		console.log("Database setup completed successfully!");
		console.log("=".repeat(100) + "\n");
	} catch (error) {
		console.error("Error setting up database:", error);
		throw error;
	} finally {
		client.release();
	}
   */
}
