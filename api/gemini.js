export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt, csvText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: "Erro de Servidor: API Key não configurada na Vercel." });

    // Pega a primeira linha do CSV (os nomes das colunas) para a IA não alucinar
    const colunasExatas = csvText.split('\n')[0];

    const sys = `Você é um analista de biestatística. Retorne APENAS código R puro (sem markdown \`\`\`R).
Dados carregados na variável 'd'. 
Nomes EXATOS das colunas disponíveis: ${colunasExatas}
Amostra dos dados: ${csvText.substring(0,250)}...

REGRA 1: Use ggplot2 para gráficos.
REGRA 2: O R está num ambiente WebR. Use apenas webr::install('nome_do_pacote') antes de library(). NUNCA use install.packages().
REGRA 3: Se o usuário pedir "kappa ponderado", use irr::kappa2(weight="squared").
REGRA 4: NUNCA invente nomes de colunas. Use ESTRITAMENTE os nomes listados acima. Se o usuário pedir algo genérico, deduza qual é a coluna exata correspondente.`;

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
