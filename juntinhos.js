// Importações
const { SerialPort } = require('serialport');
const { DelimiterParser } = require('@serialport/parser-delimiter');

// Importações do Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDPtW4UG8H87E1bPjXHsluoDiKS6dAU7Os",
  authDomain: "irrigacao-60d02.firebaseapp.com",
  databaseURL: "https://irrigacao-60d02-default-rtdb.firebaseio.com",
  projectId: "irrigacao-60d02",
  storageBucket: "irrigacao-60d02.appspot.com",
  messagingSenderId: "60564126590",
  appId: "1:60564126590:web:2aee9e97901a66e69dd12f",
  measurementId: "G-8Y3NFHVX8J"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Database
const db = getDatabase(app);

// Configuração da porta serial
const porta = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

// Configuração do parser para separar os dados por linha
const myserialparser = porta.pipe(new DelimiterParser({ delimiter: '\n' }));

// Variáveis para armazenar medições
let areaData = []; // Array para armazenar os dados de cada área

// Evento quando a porta serial é aberta
myserialparser.on('open', function() {
  console.log('Conexão Serial Aberta');
});

// Evento ao receber dados da porta serial
myserialparser.on('data', function(data) {
  // Converte os dados recebidos diretamente para uma string
  const dataReady = data.toString().trim();
  //console.log('Dados Recebidos:', dataReady); // Exibe a string recebida

  // Adiciona a linha ao buffer
  areaData.push(dataReady);

  // Verifica se recebemos todas as linhas de uma leitura
  if (areaData.length >= 8) { // Esperamos 8 linhas por leitura
    // Armazena as medições nas variáveis apropriadas
    const solo1 = areaData[1];                // Solo Seco da Área 1
    const mbomba1 = areaData[2];              // M.Bomba 1
    const umidade1 = areaData[3].split('=')[1].trim(); // Umidade 0
    
    const solo2 = areaData[5];                // Solo Seco da Área 2
    const mbomba2 = areaData[6];              // M.Bomba 2
    const umidade2 = areaData[7].split('=')[1].trim(); // Umidade 1

    // Exibe as medições armazenadas
    console.log(`Medições: 
      Solo 1: ${solo1}, 
      M.Bomba 1: ${mbomba1}, 
      Umidade 1: ${umidade1}, 
      Solo 2: ${solo2}, 
      M.Bomba 2: ${mbomba2}, 
      Umidade 2: ${umidade2}`);

    // Cria um novo nó no Firebase com as medições
    const measurementData = {
      timestamp: Date.now(), // Adiciona o timestamp
      solo1: solo1,
      mbomba1: mbomba1,
      umidade1: umidade1,
      solo2: solo2,
      mbomba2: mbomba2,
      umidade2: umidade2
    };

    // Envia os dados para o Firebase
    const dbRef = ref(db, 'medicoes/' + Date.now()); // Usa timestamp para criar um novo nó
    set(dbRef, measurementData)
      .then(() => console.log('Medições armazenadas com sucesso no Firebase!'))
      .catch((error) => console.error('Erro ao armazenar medições no Firebase:', error));

    // Limpa o buffer para a próxima leitura
    areaData = [];
  }
});

// Evento para capturar erros
porta.on('error', function(err) {
  console.log('Erro na Porta Serial:', err.message);
});
