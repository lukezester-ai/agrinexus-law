export type FeatureTier = 0 | 1 | 2 | 3;

export type Feature = {
  key: string;
  label: string;
  tier: FeatureTier;
  requiredEnvVars: string[];
  description: string;
};

const ALL_FEATURES: Feature[] = [
  {
    key: 'documentSearch',
    label: 'Търсене на документи (ДФЗ/МЗХ)',
    tier: 0,
    requiredEnvVars: [],
    description: 'agrinexus_search_documents, agrinexus_get_document, agrinexus_list_sources',
  },
  {
    key: 'metaTools',
    label: 'Mета-инструменти (list_skills, load_skill)',
    tier: 0,
    requiredEnvVars: [],
    description: 'agrinexus_list_skills, agrinexus_load_skill',
  },
  {
    key: 'ragSearch',
    label: 'Семантично AI търсене',
    tier: 1,
    requiredEnvVars: ['OPENAI_API_KEY'],
    description: 'agrinexus_query_rag, agrinexus_get_rag_context (изисква OpenAI embeddings)',
  },
  {
    key: 'aiChat',
    label: 'AI чат асистент',
    tier: 1,
    requiredEnvVars: ['OPENAI_API_KEY'],
    description: 'Chat с AI герои (Елена, Борис, Виктория)',
  },
  {
    key: 'mcpServer',
    label: 'MCP сървър (stdio)',
    tier: 2,
    requiredEnvVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    description: 'Локален MCP сървър за интеграция с външни AI агенти',
  },
  {
    key: 'knowledgeIngest',
    label: 'Web ingest pipeline',
    tier: 3,
    requiredEnvVars: ['GOOGLE_CSE_API_KEY', 'GOOGLE_CSE_CX'],
    description: 'Автоматично обхождане и индексиране на нови документи',
  },
];

export function getAvailableTiers(): FeatureTier[] {
  const available: FeatureTier[] = [0];
  if (process.env.OPENAI_API_KEY) available.push(1);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) available.push(2);
  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX) available.push(3);
  return [...new Set(available)].sort();
}

export function getEnabledFeatures(): Feature[] {
  const availableTiers = getAvailableTiers();
  return ALL_FEATURES.filter(f => availableTiers.includes(f.tier));
}

export function isFeatureEnabled(key: string): boolean {
  return getEnabledFeatures().some(f => f.key === key);
}

export function getMissingEnvVars(): string[] {
  const allRequired = new Set(ALL_FEATURES.flatMap(f => f.requiredEnvVars));
  return [...allRequired].filter(v => !process.env[v]);
}

export function getFeatureStatusTable(): string {
  const lines: string[] = [];
  lines.push('| Feature | Tier | Key needed | Status |');
  lines.push('|---------|------|------------|--------|');
  for (const f of ALL_FEATURES) {
    const available = getAvailableTiers().includes(f.tier);
    const keyLabel = f.requiredEnvVars.length > 0 ? f.requiredEnvVars.join(', ') : '—';
    lines.push(`| ${f.label} | ${f.tier} | ${keyLabel} | ${available ? '✅' : '❌'} |`);
  }
  return lines.join('\n');
}
