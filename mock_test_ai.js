import 'dotenv/config';
import 'dotenv/config';
import { Mistral } from '@mistralai/mistralai';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // e.g. postgres://user:password@localhost:5432/db
});

const ingredients = ['xylitol', 'sls']; // here goes the list from the ocr
const processed_ingredients = [];

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

const embeddingResponse = await client.embeddings.create({
    model: "mistral-embed",
    inputs: ingredients,
});

const inputEmbeddings = embeddingResponse.data
for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    const emb = inputEmbeddings[i].embedding

    const res = await pool.query(
        `SELECT id, name, score, function_type, embedding_name <-> $1 AS distance
     FROM ingredients ORDER BY embedding_name <-> $1 LIMIT 1`,
        [JSON.stringify(emb)]
    );
    console.log(`Similar ingredients to ${ingredient}`);

    res.rows.forEach(r => processed_ingredients.push({
        "name": r.name,
        "safety_score": r.score,
        "function_type": r.function_type,
    }))

}

console.log("raw data", processed_ingredients);

const ai_ranking = await client.chat.complete({
    model: "mistral-medium-latest",
    messages: [
    { role: "system", content: `Rate the overall score for this raw_data: ${JSON.stringify(processed_ingredients)}.
    - Score 10 = very good, 0 = very bad
    - Reply very shortly with a reason
    - Then output the same raw_data, unchanged, but formatted as valid JSON` }
    ]
})





console.log(ai_ranking.choices[0].message.content);



