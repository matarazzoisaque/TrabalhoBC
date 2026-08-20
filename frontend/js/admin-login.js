document.querySelector("#form-admin-login")?.addEventListener("submit", (evento) => {
  evento.preventDefault();
  UrnaApp.mostrarMensagem(document.querySelector("#admin-login-mensagem"), "Acesso validado. Abrindo painel.");
  window.setTimeout(() => { window.location.href = "admin-dash.html"; }, 400);
});
