/**
 * Controle de frequência por chave (em geral, o ID do usuário).
 * A janela vem das configurações do servidor em cada chamada.
 */
export class Cooldown {
  private readonly lastHit = new Map<string, number>();

  /**
   * @returns milissegundos restantes se ainda estiver em cooldown; 0 se pode seguir.
   */
  remaining(key: string, windowMs: number): number {
    if (windowMs <= 0) {
      return 0;
    }

    const last = this.lastHit.get(key);
    if (last === undefined) {
      return 0;
    }

    const elapsed = Date.now() - last;
    return elapsed >= windowMs ? 0 : windowMs - elapsed;
  }

  hit(key: string): void {
    this.lastHit.set(key, Date.now());
  }
}
