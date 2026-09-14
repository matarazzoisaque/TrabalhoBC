/* Utilitários gerais do sistema BOOK BOOK. */

/**
 * Formata um nome no padrão ABNT: ÚLTIMO SOBRENOME, Nome Restante.
 * Exemplo: "Machado de Assis" -> "ASSIS, Machado de"
 * Exemplo: "Clarice Lispector" -> "LISPECTOR, Clarice"
 * Exemplo: "Aristóteles" -> "ARISTÓTELES"
 */
function formatarNomeABNT(nome) {
    if (!nome || typeof nome !== 'string') return '';
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '';
    if (partes.length === 1) return partes[0].toUpperCase();

    const ultimoSobrenome = partes.pop().toUpperCase();
    const restoDoNome = partes.join(' ');
    return `${ultimoSobrenome}, ${restoDoNome}`;
}

/**
 * Recebe uma string com múltiplos valores (separados por "; ") ou um array de valores.
 * Formata o primeiro item (aplicando formatarItemFn se fornecida) e adiciona " +N" se houver mais itens.
 * Exemplo autor ABNT: "Machado de Assis; Eça de Queirós" -> "ASSIS, Machado de +1"
 * Exemplo gênero: "Ficção Científica; Romance; Distopia" -> "Ficção Científica +2"
 */
function formatarListaTruncada(dado, formatarItemFn = null) {
    if (!dado) return '';

    const itens = Array.isArray(dado)
        ? dado
        : String(dado).split('; ').map(s => s.trim()).filter(Boolean);

    if (itens.length === 0) return '';

    const primeiro = formatarItemFn ? formatarItemFn(itens[0]) : itens[0];
    if (itens.length === 1) {
        return primeiro;
    }

    return `${primeiro} +${itens.length - 1}`;
}
