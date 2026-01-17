O erro `500` está ocorrendo porque, ao trocar a chave do Stripe, os dados antigos salvos no banco de dados (IDs de Clientes e IDs de Planos) não existem na nova conta do Stripe.

Para corrigir isso definitivamente, farei o seguinte:

1. **Atualizar a Edge Function (`create-checkout-session`)**:

   * Adicionar uma lógica de recuperação automática: se a função tentar usar um Cliente antigo e o Stripe rejeitar (erro "Cliente não encontrado"), a função criará automaticamente um novo Cliente na nova conta Stripe e atualizará o banco de dados.

2. **Sincronizar os Planos**:

   * Executarei a função `setup-stripe-plans` remotamente para garantir que os Planos (Mensal/Anual) sejam criados na sua nova conta Stripe e que os IDs corretos sejam salvos no banco de dados.

Dessa forma, o sistema se auto-corrigirá na próxima tentativa de assinatura.

### Próximos Passos:

1. Editar `create-checkout-session/index.ts` com a lógica de correção de cliente.
2. Fazer deploy da função atualizada.
3. Executar o comando de configuração de planos para corrigir os preços.

