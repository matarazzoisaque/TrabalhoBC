window.UrnaApp = {
  async api(caminho, opcoes = {}) {
    const resposta = await fetch(caminho, opcoes);
    if (!resposta.ok) {
      throw new Error("Nao foi possivel concluir a solicitacao.");
    }
    return resposta.json();
  },

  mostrarMensagem(elemento, texto) {
    if (elemento) elemento.textContent = texto;
  },
};
