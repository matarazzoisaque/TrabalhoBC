document.querySelector("#form-urna")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const numero = new FormData(evento.currentTarget).get("numero");
  UrnaApp.mostrarMensagem(document.querySelector("#urna-mensagem"), `Numero ${numero} confirmado.`);
});
