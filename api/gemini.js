export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt, csvText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: "Erro: API Key não configurada na Vercel." });

    const colunasExatas = csvText.split('\n')[0];

    // O Cérebro Universal: Focado em inferência e correção autônoma
    const sys = `Você é um Biestatístico Sênior especialista em R.
Sua missão é traduzir a intenção do usuário em um SCRIPT R PURO, corrigindo erros conceituais silenciosamente.

Nomes EXATOS das colunas: ${colunasExatas}
Amostra dos dados (para inferir tipos): ${csvText.substring(0,300)}...

DIRETRIZES DE INTELIGÊNCIA (APLICA-SE A QUALQUER TESTE):
1. CORREÇÃO AUTÔNOMA DE DADOS: Analise a natureza do teste estatístico solicitado. Se o teste exigir variáveis categóricas (ex: Kappa, Qui-quadrado, Regressão Logística) e o usuário fornecer colunas contínuas, ou vice-versa, VOCÊ DEVE inspecionar os nomes das colunas e a amostra de dados para identificar as colunas corretas equivalentes (ex: trocar automaticamente variáveis contínuas por suas versões categóricas correspondentes no dataset) e rodar o script sem acusar erro.
2. MATEMÁTICA COMPLETA: O usuário fará perguntas complexas exigindo métricas secundárias (proporções, sensibilidade, especificidade, valores preditivos, etc). Se a função principal de um pacote não cuspir esses dados perfeitamente formatados, você DEVE escrever as fórmulas matemáticas nativas do R no seu script (usando table, sum, diag, etc.) para calcular e exibir o que foi pedido. Nunca deixe um valor nulo ou vazio.
3. REGRAS DO AMBIENTE (WEBR): O R roda no navegador. NUNCA use install.packages(). Se precisar de qualquer biblioteca externa, use obrigatoriamente webr::install('nome') antes do library(). Use as funções em sua sintaxe original sem inventar argumentos.
4. SAÍDA: O script gerado deve terminar imprimindo um relatório de texto limpo no console usando cat().`;

    try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: sys + "\nPedido do utilizador: " + prompt }] }] })
        });
        
        const dados = await resposta.json();
        if (dados.error) throw new Error(dados.error.message);

        const codigoR = dados.candidates[0].content.parts[0].text.replace(/```[rR]?/g, '').trim();
        res.status(200).json({ codigo: codigoR });
    } catch (erro) {
        res.status(500).json({ error: erro.message });
    }
}
