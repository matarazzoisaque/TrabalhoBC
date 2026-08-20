document.querySelector("#form-login")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  UrnaApp.mostrarMensagem(document.querySelector("#login-mensagem"), "Acesso validado. Redirecionando para a urna.");
  window.setTimeout(() => { window.location.href = "urna.html"; }, 400);
});
