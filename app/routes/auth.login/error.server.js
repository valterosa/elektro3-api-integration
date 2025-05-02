/**
 * Manipula erros de login e retorna mensagens amigáveis
 * @param {Object} loginResult - O resultado da operação de login
 * @returns {Object} - Objeto contendo mensagens de erro formatadas
 */
export function loginErrorMessage(loginResult) {
  // Se loginResult for undefined ou null, retorne um objeto padrão
  if (!loginResult) {
    console.error("loginResult é undefined ou null");
    return { shop: "Ocorreu um erro ao processar o login. Tente novamente." };
  }

  // Se há erros específicos para o campo shop
  if (loginResult.loginErrors?.shop) {
    return { shop: loginResult.loginErrors.shop };
  }

  // Se há um erro genérico
  if (
    loginResult.loginErrors &&
    Object.keys(loginResult.loginErrors).length > 0
  ) {
    const errorKey = Object.keys(loginResult.loginErrors)[0];
    return { shop: loginResult.loginErrors[errorKey] };
  }

  return { shop: null };
}
