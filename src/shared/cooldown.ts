/**
 * Controle de frequência por chave (em geral, o ID do usuário).
 * Impede que uma pessoa dispare várias chamadas de IA em sequência.
 */
export class Cooldown {
  private readonly lastHit = new Map<string, number>();

  constructor(private readonly windowMs: number) {}

  /**
   * @returns milissegundos restantes se ainda estiver em cooldown; 0 se pode seguir.
   */
  remaining(key: string): number {
    const last = this.lastHit.get(key);
    if (last === undefined) {
      return 0;
    }

    const elapsed = Date.now() - last;
    return elapsed >= this.windowMs ? 0 : this.windowMs - elapsed;
  }

  hit(key: string): void {
    this.lastHit.set(key, Date.now());
  }
}
