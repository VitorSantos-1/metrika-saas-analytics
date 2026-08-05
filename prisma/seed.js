const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando o seed do banco de dados...');

  const crypto = require('crypto');
  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  const defaultHash = hashPassword('metrika123');

  // 1. Limpar banco existente (na ordem reversa de relações)
  await prisma.session.deleteMany({});
  await prisma.dataExportClick.deleteMany({});
  await prisma.pageView.deleteMany({});
  await prisma.widget.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.page.deleteMany({});
  await prisma.dataConnection.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Banco de dados limpo.');

  // 2. Criar Usuário Admin (vitor@metrika.io)
  const user = await prisma.user.create({
    data: {
      name: 'Vitor Santos (Admin)',
      email: 'vitor@metrika.io',
      passwordHash: defaultHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Criar Usuário PRO (pro@metrika.io)
  const userPro = await prisma.user.create({
    data: {
      name: 'Cliente Plano PRO',
      email: 'pro@metrika.io',
      passwordHash: defaultHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    },
  });

  // Criar Usuário ENTERPRISE (enterprise@metrika.io)
  const userEnterprise = await prisma.user.create({
    data: {
      name: 'Cliente Plano Enterprise',
      email: 'enterprise@metrika.io',
      passwordHash: defaultHash,
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
    },
  });

  console.log('Usuários de teste criados (Admin, PRO, Enterprise).');

  // 3. Criar Assinaturas
  await prisma.subscription.create({
    data: {
      userId: user.id,
      planType: 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 ano
    },
  });

  await prisma.subscription.create({
    data: {
      userId: userPro.id,
      planType: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscription.create({
    data: {
      userId: userEnterprise.id,
      planType: 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Criar Páginas Públicas
  const page = await prisma.page.create({
    data: {
      userId: user.id,
      username: 'vitor',
      publicName: 'Vitor Santos | Data Analytics',
      bio: 'Head de Growth & BI. Dashboards operacionais de marketing, vendas e saúde financeira consolidados em tempo real.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      themeId: 'sleek-dark',
      isPublished: true,
    },
  });

  const pagePro = await prisma.page.create({
    data: {
      userId: userPro.id,
      username: 'pro',
      publicName: 'Workspace PRO | Analytics',
      bio: 'Página de relatórios de dados do plano PRO.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      themeId: 'oceanic',
      isPublished: true,
    },
  });

  const pageEnterprise = await prisma.page.create({
    data: {
      userId: userEnterprise.id,
      username: 'enterprise',
      publicName: 'Corporate Enterprise BI',
      bio: 'Dashboard central corporativo do plano Enterprise.',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
      themeId: 'cyberpunk',
      isPublished: true,
    },
  });

  console.log('Páginas públicas criadas.');

  // 5. Criar Pastas (Sub-relatórios)
  const folderMarketing = await prisma.folder.create({
    data: {
      pageId: page.id,
      name: 'Marketing & CAC',
      slug: 'marketing',
      sortOrder: 1,
    },
  });

  const folderFinanceiro = await prisma.folder.create({
    data: {
      pageId: page.id,
      name: 'Finanças & Custos',
      slug: 'financeiro',
      sortOrder: 2,
    },
  });

  console.log('Pastas/sub-relatórios criados: marketing e financeiro');

  // 6. Criar Conexões de Dados do Usuário
  const connPostgres = await prisma.dataConnection.create({
    data: {
      userId: user.id,
      name: 'Banco de Produção Vendas',
      type: 'POSTGRESQL',
      connectionString: 'postgresql://read_only_user:***@db.mycompany.com:5432/sales_prod',
      isActive: true,
    },
  });

  const connSheets = await prisma.dataConnection.create({
    data: {
      userId: user.id,
      name: 'Planilha de Leads 2026',
      type: 'GOOGLESHEETS',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKv1GS5_dNIb4dfyUt/edit',
      isActive: true,
    },
  });

  const connCsv = await prisma.dataConnection.create({
    data: {
      userId: user.id,
      name: 'Faturamento Anual (CSV)',
      type: 'CSV_PARQUET_FILE',
      fileUrl: '/data/faturamento_2026.csv',
      isActive: true,
    },
  });

  console.log('Conexões de dados simuladas criadas.');

  // 7. Criar Widgets de Exemplo (com dados cacheados em JSON)
  
  // WIDGETS DA HOME (Gerais)
  
  // Widget 1: KPI Faturamento
  await prisma.widget.create({
    data: {
      pageId: page.id,
      connectionId: connCsv.id,
      title: 'Faturamento Total (R$)',
      type: 'KPI_CARD',
      query: 'SELECT SUM(valor) FROM faturamento',
      sortOrder: 1,
      cachedData: JSON.stringify({
        value: 'R$ 142.520,00',
        change: '+15.4%',
        isPositive: true,
        subtext: 'vs. mês passado',
      }),
      lastRefreshed: new Date(),
    },
  });

  // Widget 2: KPI CAC
  await prisma.widget.create({
    data: {
      pageId: page.id,
      connectionId: connSheets.id,
      title: 'CAC Médio (Custo de Aquisição)',
      type: 'KPI_CARD',
      query: 'SELECT SUM(spend)/SUM(leads) FROM marketing_data',
      sortOrder: 2,
      cachedData: JSON.stringify({
        value: 'R$ 42,30',
        change: '-8.2%',
        isPositive: true,
        subtext: 'melhoria de eficiência',
      }),
      lastRefreshed: new Date(),
    },
  });

  // Widget 3: KPI Conversão
  await prisma.widget.create({
    data: {
      pageId: page.id,
      connectionId: connPostgres.id,
      title: 'Taxa de Conversão Geral',
      type: 'KPI_CARD',
      query: 'SELECT (compras/acessos)*100 FROM funnel_daily',
      sortOrder: 3,
      cachedData: JSON.stringify({
        value: '2.85%',
        change: '+0.4%',
        isPositive: true,
        subtext: 'meta: 3.0%',
      }),
      lastRefreshed: new Date(),
    },
  });

  // Widget 4: Gráfico de Linha - Evolução Mensal
  const chartEvolucao = [
    { name: 'Jan', vendas: 82000, meta: 80000 },
    { name: 'Fev', vendas: 95000, meta: 85000 },
    { name: 'Mar', vendas: 110000, meta: 90000 },
    { name: 'Abr', vendas: 105000, meta: 95000 },
    { name: 'Mai', vendas: 125000, meta: 100000 },
    { name: 'Jun', vendas: 142520, meta: 110000 },
  ];
  await prisma.widget.create({
    data: {
      pageId: page.id,
      connectionId: connCsv.id,
      title: 'Evolução do Faturamento Mensal (R$) vs Meta',
      type: 'LINE_CHART',
      query: 'SELECT mes, SUM(valor) FROM faturamento GROUP BY mes',
      sortOrder: 4,
      cachedData: JSON.stringify(chartEvolucao),
      lastRefreshed: new Date(),
    },
  });

  console.log('Widgets da página principal criados.');

  // WIDGETS DO SUB-RELATÓRIO MARKETING
  
  // Widget 5: Gráfico de Pizza - Origem de Tráfego
  const chartTrafego = [
    { name: 'Orgânico', value: 45 },
    { name: 'Tráfego Pago', value: 30 },
    { name: 'Direto', value: 15 },
    { name: 'Social', value: 10 },
  ];
  await prisma.widget.create({
    data: {
      pageId: page.id,
      folderId: folderMarketing.id,
      connectionId: connSheets.id,
      title: 'Canais de Origem do Tráfego (%)',
      type: 'PIE_CHART',
      query: 'SELECT canal, COUNT(*) FROM leads GROUP BY canal',
      sortOrder: 1,
      cachedData: JSON.stringify(chartTrafego),
      lastRefreshed: new Date(),
    },
  });

  // Widget 6: Gráfico de Barras - Campanhas Ads
  const chartCampanhas = [
    { name: 'Google Ads', clicks: 2400, leads: 400 },
    { name: 'Meta Ads', clicks: 3200, leads: 550 },
    { name: 'LinkedIn Ads', clicks: 800, leads: 90 },
    { name: 'YouTube', clicks: 1500, leads: 120 },
  ];
  await prisma.widget.create({
    data: {
      pageId: page.id,
      folderId: folderMarketing.id,
      connectionId: connSheets.id,
      title: 'Cliques e Leads por Plataforma de Ads',
      type: 'BAR_CHART',
      query: 'SELECT plataforma, clicks, leads FROM ads_perf',
      sortOrder: 2,
      cachedData: JSON.stringify(chartCampanhas),
      lastRefreshed: new Date(),
    },
  });

  console.log('Widgets do sub-relatório Marketing criados.');

  // WIDGETS DO SUB-RELATÓRIO FINANCEIRO

  // Widget 7: Gráfico de Pizza - Detalhamento de Custos
  const chartCustos = [
    { name: 'Infraestrutura Cloud', valor: 12400 },
    { name: 'Marketing Digital', valor: 22000 },
    { name: 'Ferramentas & APIs', valor: 4500 },
    { name: 'Equipe & Freelancers', valor: 48000 },
  ];
  await prisma.widget.create({
    data: {
      pageId: page.id,
      folderId: folderFinanceiro.id,
      connectionId: connPostgres.id,
      title: 'Distribuição Mensal de Custos (R$)',
      type: 'PIE_CHART',
      query: 'SELECT categoria, valor FROM despesas',
      sortOrder: 1,
      cachedData: JSON.stringify(chartCustos),
      lastRefreshed: new Date(),
    },
  });

  // Widget 8: Tabela - Últimos Pedidos
  const tablePedidos = [
    { id: 'PED-0431', cliente: 'Empresa Alfa', valor: 'R$ 4.250,00', status: 'Pago', data: '13/07/2026' },
    { id: 'PED-0430', cliente: 'Betta Corp', valor: 'R$ 1.890,00', status: 'Pago', data: '12/07/2026' },
    { id: 'PED-0429', cliente: 'Clínica Vida', valor: 'R$ 8.400,00', status: 'Pendente', data: '11/07/2026' },
    { id: 'PED-0428', cliente: 'Marcos Silva', valor: 'R$ 320,00', status: 'Cancelado', data: '10/07/2026' },
    { id: 'PED-0427', cliente: 'Tech Soluções', valor: 'R$ 12.000,00', status: 'Pago', data: '09/07/2026' },
  ];
  await prisma.widget.create({
    data: {
      pageId: page.id,
      folderId: folderFinanceiro.id,
      connectionId: connPostgres.id,
      title: 'Últimos Pedidos Processados (Banco de Dados)',
      type: 'TABLE',
      query: 'SELECT id, cliente, valor, status, data FROM pedidos ORDER BY data DESC LIMIT 5',
      sortOrder: 2,
      cachedData: JSON.stringify(tablePedidos),
      lastRefreshed: new Date(),
    },
  });

  console.log('Widgets do sub-relatório Financeiro criados.');

  // 8. Criar Registros Simulados de Acessos (Views)
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    await prisma.pageView.create({
      data: {
        pageId: page.id,
        accessedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
      },
    });
  }

  console.log('Registros simulados de PageViews adicionados.');
  console.log('Seed do banco de dados concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
