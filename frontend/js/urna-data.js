const electionConfig = {
  title: "Votação dos melhores professores",
  role: "Professor",
  numberLength: 2,
  allowNullVote: true,
  identification: {
    title: "Identificação do eleitor",
    submitLabel: "Iniciar votação",
  },
  sound: {
    localFile: "../assets/sounds/vote-confirmation.mp3",
    useLocalFile: false,
  },
  labels: {
    idle: "Digite o número do candidato",
    found: "Candidato encontrado",
    typing: "Confira seu voto",
    notFound: "Candidato não encontrado",
    blank: "Voto em branco",
    end: "Fim",
  },
};

const candidates = [
  { id: 1, number: "10", name: "Ana Beatriz Souza", party: "Renovação Escolar", photo: "", role: "Professor" },
  { id: 2, number: "20", name: "Carlos Eduardo Lima", party: "Educação para Todos", photo: "", role: "Professor" },
  { id: 3, number: "30", name: "Marina Alves Costa", party: "Avança Escola", photo: "", role: "Professor" },
];

const candidateSource = {
  async getAll() {
    return candidates;
  },
};