// SECTION: Inicialização do Sistema
// (Deve aparecer uma linha verde acima disto com um pequeno espaço)


// MARK: Autenticação
// (Na barra lateral, os métodos abaixo devem ser "filhos" deste MARK)

class AuthController {
    
    // TODO: Adicionar validação de token JWT aqui
    // (Deve ter uma linha laranja acima)
    
    login(user: string, pass: string) {
        console.log("Logging in...");
    }

    logout() {
        console.log("Logging out...");
        this.clearCache();
    }

    private clearCache() {
        // HACK: Limpeza forçada para evitar bugs de memória
        localStorage.clear();
    }
}

// MARK: Gestão de Utilizadores
// (Este é um novo grupo pai na árvore)

function createUser(name: string) {
    // FIXME: Verificar se o nome é único na base de dados
    return { id: 1, name };
}

const deleteUser = (id: number) => {
    console.log("Deleting user", id);
};

/* SECTION: Utilitários Globais
   (Teste de comentário em bloco como divisor)
*/

// NOTE: Esta função é pura e não tem efeitos colaterais
export function formatDate(date: Date): string {
    return date.toISOString();
}