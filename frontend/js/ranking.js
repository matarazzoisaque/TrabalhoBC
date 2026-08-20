UrnaApp.api("/api/ranking")
  .then((ranking) => {
    const lista = document.querySelector("#lista-ranking");
    const vazio = document.querySelector("#ranking-vazio");
    if (!ranking.length) return;
    vazio.hidden = true;
    ranking.forEach((item) => {
      const linha = document.createElement("li");
      linha.textContent = `${item.nome}: ${item.votos} voto(s)`;
      lista.appendChild(linha);
    });
  })
  .catch(() => UrnaApp.mostrarMensagem(document.querySelector("#ranking-vazio"), "Ranking indisponivel."));
