Promise.all([UrnaApp.api("/api/status"), UrnaApp.api("/api/ranking")])
  .then(([status, ranking]) => {
    document.querySelector("#status-servico").textContent = status.status;
    document.querySelector("#total-ranking").textContent = ranking.length;
  })
  .catch(() => { document.querySelector("#status-servico").textContent = "Indisponivel"; });
