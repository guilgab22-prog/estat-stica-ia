export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { prompt, csvText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // A chave secreta que vamos colocar na Vercel

    if (!apiKey) return res.status(500).json({ error: "Erro de Servidor: API Key não configurada." });

    const sys = `Retorne APENAS código R (sem markdown). Use ggplot2 para gráficos. Dados na variável 'd'. Amostra: ${csvText.substring(0,300)}`;

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
