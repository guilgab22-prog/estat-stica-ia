export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt, csvText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: "Erro de Servidor: API Key não configurada na Vercel." });

    const colunasExatas = csvText.split('\n')[0];

    // Instrução blindada: A IA é apenas uma geradora de scripts R.
    const sys = `Você é um Engenheiro de Dados focado em R. Sua ÚNICA função é traduzir o pedido do usuário para um SCRIPT EM R. 
Você NUNCA deve tentar calcular, deduzir ou estimar valores matemáticos por conta própria. Todo o processamento matemático DEVE ocorrer estritamente dentro da execução do código R que você gerar.

Retorne APENAS código R puro (sem markdown \`\`\`R).
Dados carregados na variável 'd'. 
Nomes EXATOS das colunas disponíveis: ${colunasExatas}

REGRA 1: O R está num ambiente WebR. Use webr::install('nome_do_pacote') antes de library(). NUNCA use install.packages().
REGRA 2: Use ggplot2 para gráficos com qualidade de publicação.
REGRA 3: Para Kappa Ponderado, o SCRIPT R deve instalar e usar o pacote 'psych' (função cohen.kappa com weight="squared").
REGRA 4: Se o usuário pedir métricas que a função principal não extrai facilmente (como proporções de concordância), O SEU SCRIPT R deve conter as fórmulas matemáticas nativas do R (ex: manipulando table(), sum(), diag(), etc) para calcular esses valores a partir dos dados.
REGRA 5: O SCRIPT R gerado deve terminar imprimindo todos os resultados solicitados no console usando a função cat() ou print() de forma organizada.`;

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
