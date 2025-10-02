import 'dotenv/config';
import { Mistral } from '@mistralai/mistralai';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // e.g. postgres://user:password@localhost:5432/db
});

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function embedAndInsert(ingredients) {
    const texts = ingredients.map(i => i.text);
    const response = await client.embeddings.create({
        model: "mistral-embed",
        inputs: texts,
    });

    for (let i = 0; i < response.data.length; i++) {
        const embedding = response.data[i].embedding;
        const embedding_string = JSON.stringify(embedding);
        const id = ingredients[i].id;
        await pool.query(
            `UPDATE ingredients SET embedding_name = $1 WHERE id = $2`,
            [embedding_string, id]
        );
        console.log(`Inserted embedding for id=${id} | length=${embedding.length}`);
    }

}
const ingredients = [
    { id: 1, text: "Sodium Fluoride" },
    { id: 2, text: "Hydrated Silica" },
    { id: 3, text: "Sodium Lauryl Sulfate (SLS)" },
    { id: 4, text: "Sorbitol" },
    { id: 5, text: "Titanium Dioxide" },
    { id: 6, text: "Potassium Nitrate" },
    { id: 7, text: "Xylitol" },
];
(async () => {
    await embedAndInsert(ingredients);
    await pool.end();
})();
