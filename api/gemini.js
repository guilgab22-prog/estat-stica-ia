export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt, csvText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: "Erro de Servidor: API Key não configurada na Vercel." });

    const sys = `Você é um analista de biestatística. Retorne APENAS código R puro (sem markdown \`\`\`R).
Dados carregados na variável 'd'. Amostra: ${csvText.substring(0,300)}...

REGRA 1: Use ggplot2 para gráficos.
REGRA 2: O R está num ambiente WebR. NUNCA use install.packages(). Se precisar de pacotes, use webr::install('nome_do_pacote') antes do library().
REGRA 3: Simplifique a vida do usuário. Se ele pedir apenas "kappa ponderado", assuma automaticamente a função kappa2 do pacote 'irr' usando o argumento weight = "squared" por padrão. NUNCA traduza os nomes dos argumentos internos das funções do R para português.`;

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
