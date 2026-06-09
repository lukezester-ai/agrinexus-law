import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
	for (const envFile of ['.env.local', '.env']) {
		const envPath = path.join(__dirname, '..', envFile);
		if (!fs.existsSync(envPath)) continue;
		const text = fs.readFileSync(envPath, 'utf8');
		text.split('\n').forEach((line) => {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) return;
			const separatorIndex = trimmed.indexOf('=');
			if (separatorIndex < 1) return;
			const key = trimmed.slice(0, separatorIndex);
			const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
			if (!process.env[key]) process.env[key] = value;
		});
	}
}
loadEnv();

async function run() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
		process.exitCode = 1;
		return;
	}

	const supabase = createClient(supabaseUrl, serviceRoleKey);
	const { count, error: countErr } = await supabase.from('public_documents').select('*', { count: 'exact', head: true });
	if (countErr) {
		console.error('Error fetching count:', countErr);
		process.exitCode = 1;
		return;
	}
	console.log('Total documents in DB:', count);

	const { data, error } = await supabase.from('public_documents')
		.select('title, category, source_url, created_at')
		.order('created_at', { ascending: false })
		.limit(10);

	if (error) {
		console.error('Error fetching documents:', error);
		process.exitCode = 1;
		return;
	}

	console.log('\nLatest downloaded documents:');
	for (const document of data || []) {
		console.log(`- [${document.category || 'Без категория'}] ${document.title}`);
		console.log(`  Source: ${document.source_url}`);
	}
}
run().catch((error) => {
	console.error('Unexpected document check failure:', error);
	process.exitCode = 1;
});
