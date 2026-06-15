const USUARIOS_STORAGE_KEY = "biblioteca_usuarios_teste";
const SESSAO_STORAGE_KEY = "biblioteca_usuario_logado";
const CODIGOS_MASTER_STORAGE_KEY = "biblioteca_codigos_master_teste";
const CODIGO_MASTER_PADRAO = "BIBLIOTECA2026";

const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const formRecuperacao = document.getElementById("form-recuperacao");
const loginPerfil = document.getElementById("login-perfil");
const grupoModuloBibliotecario = document.getElementById("grupo-modulo-bibliotecario");
const cadastroPerfil = document.getElementById("cadastro-perfil");
const grupoCodigoBibliotecario = document.getElementById("grupo-codigo-bibliotecario");
const cadastroFoto = document.getElementById("cadastro-foto");

inicializarCodigosMaster();

// Alterna entre os formularios de login e cadastro.
function mostrarAba(aba) {
    const loginAtivo = aba === "login";

    document.getElementById("tab-login").classList.toggle("active", loginAtivo);
    document.getElementById("tab-cadastro").classList.toggle("active", !loginAtivo);
    formLogin.classList.toggle("hidden", !loginAtivo);
    formCadastro.classList.toggle("hidden", loginAtivo);
    formRecuperacao.classList.add("hidden");
}

function mostrarRecuperacao() {
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("tab-cadastro").classList.remove("active");
    formLogin.classList.add("hidden");
    formCadastro.classList.add("hidden");
    formRecuperacao.classList.remove("hidden");
}

function voltarParaLogin() {
    formRecuperacao.reset();
    mostrarAba("login");
}

function atualizarModuloBibliotecario() {
    const bibliotecarioSelecionado = loginPerfil.value === "BIBLIOTECARIO";
    const loginModulo = document.getElementById("login-modulo");

    grupoModuloBibliotecario.classList.toggle("hidden", !bibliotecarioSelecionado);
    loginModulo.required = bibliotecarioSelecionado;

    if (!bibliotecarioSelecionado) {
        loginModulo.value = "cliente.html";
    }
}

// Mostra o campo de codigo somente quando o usuario tenta cadastrar bibliotecario.
if (cadastroPerfil) {
    cadastroPerfil.addEventListener("change", function () {
        const bibliotecarioSelecionado = cadastroPerfil.value === "BIBLIOTECARIO";
        grupoCodigoBibliotecario.classList.toggle("hidden", !bibliotecarioSelecionado);
        document.getElementById("codigo-bibliotecario").required = bibliotecarioSelecionado;
    });
}

// Mostra a escolha de modulo no login somente para bibliotecario.
if (loginPerfil) {
    loginPerfil.addEventListener("change", atualizarModuloBibliotecario);
    atualizarModuloBibliotecario();
}

if (formCadastro) {
    formCadastro.addEventListener("submit", function (event) {
        event.preventDefault();
        cadastrarUsuario();
    });
}

if (formLogin) {
    formLogin.addEventListener("submit", function (event) {
        event.preventDefault();
        fazerLogin();
    });
}

if (formRecuperacao) {
    formRecuperacao.addEventListener("submit", function (event) {
        event.preventDefault();
        recuperarSenha();
    });
}

// Cadastra usuario em localStorage apenas para teste de frontend.
async function cadastrarUsuario() {
    const usuarios = carregarUsuarios();
    const nome = document.getElementById("cadastro-nome").value.trim();
    const email = document.getElementById("cadastro-email").value.trim().toLowerCase();
    const whatsapp = document.getElementById("cadastro-whatsapp").value.trim();
    const instituicao = document.getElementById("cadastro-instituicao").value.trim();
    const senha = document.getElementById("cadastro-senha").value;
    const perfil = document.getElementById("cadastro-perfil").value;
    const codigoBibliotecario = document.getElementById("codigo-bibliotecario").value;
    const foto = await obterFotoBase64(cadastroFoto.files[0]);

    if (usuarios.some(usuario => usuario.email === email)) {
        alert("Ja existe uma conta com este email.");
        return;
    }

    if (perfil === "BIBLIOTECARIO" && !codigoMasterValido(codigoBibliotecario)) {
        alert("Codigo de bibliotecario invalido. Solicite um codigo ao usuario master.");
        return;
    }

    usuarios.push({ nome, email, whatsapp, instituicao, senha, perfil, foto });
    salvarUsuarios(usuarios);
    formCadastro.reset();
    grupoCodigoBibliotecario.classList.add("hidden");
    alert("Cadastro criado com sucesso. Agora faca login.");
    mostrarAba("login");
}

// Faz login usando o perfil salvo no cadastro, sem deixar o usuario escolher perfil ao entrar.
function fazerLogin() {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const senha = document.getElementById("login-senha").value;
    const perfilSelecionado = document.getElementById("login-perfil").value;
    const usuario = carregarUsuarios().find(item => item.email === email && item.senha === senha);

    if (!usuario) {
        alert("Email ou senha invalidos.");
        return;
    }

    if (usuario.perfil !== perfilSelecionado) {
        alert("Este usuario nao possui permissao para entrar com o perfil selecionado.");
        return;
    }

    localStorage.setItem(SESSAO_STORAGE_KEY, JSON.stringify({
        nome: usuario.nome,
        email: usuario.email,
        whatsapp: usuario.whatsapp,
        instituicao: usuario.instituicao,
        perfil: usuario.perfil,
        foto: usuario.foto
    }));

    redirecionarPorPerfil(usuario.perfil, document.getElementById("login-modulo").value);
}

// Direciona cada perfil para a area permitida no teste de frontend.
function redirecionarPorPerfil(perfil, moduloBibliotecario) {
    if (perfil === "BIBLIOTECARIO") {
        window.location.href = `./${moduloBibliotecario || "cliente.html"}`;
        return;
    }

    window.location.href = "./livros.html";
}

function carregarUsuarios() {
    const dados = localStorage.getItem(USUARIOS_STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
}

function salvarUsuarios(usuarios) {
    localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(usuarios));
}

function recuperarSenha() {
    const email = document.getElementById("recuperacao-email").value.trim().toLowerCase();
    const novaSenha = document.getElementById("recuperacao-nova-senha").value;
    const confirmarSenha = document.getElementById("recuperacao-confirmar-senha").value;
    const usuarios = carregarUsuarios();
    const usuario = usuarios.find(item => item.email === email);

    if (!usuario) {
        alert("Nao encontramos uma conta com este email.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert("As senhas nao conferem.");
        return;
    }

    usuario.senha = novaSenha;
    salvarUsuarios(usuarios);
    formRecuperacao.reset();
    alert("Senha atualizada com sucesso. O envio por email precisa de backend; por enquanto a recuperacao foi feita neste navegador.");
    mostrarAba("login");
}

// Simula codigos que seriam gerados pelo usuario master no backend.
function inicializarCodigosMaster() {
    if (!localStorage.getItem(CODIGOS_MASTER_STORAGE_KEY)) {
        localStorage.setItem(CODIGOS_MASTER_STORAGE_KEY, JSON.stringify([CODIGO_MASTER_PADRAO]));
    }
}

function codigoMasterValido(codigo) {
    const codigos = JSON.parse(localStorage.getItem(CODIGOS_MASTER_STORAGE_KEY) || "[]");
    return codigos.includes(codigo);
}

function obterFotoBase64(arquivo) {
    return new Promise(resolve => {
        if (!arquivo) {
            resolve("");
            return;
        }

        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result);
        leitor.onerror = () => resolve("");
        leitor.readAsDataURL(arquivo);
    });
}
