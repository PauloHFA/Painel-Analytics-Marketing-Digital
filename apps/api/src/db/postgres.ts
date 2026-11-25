import { Pool, PoolClient } from 'pg';
import { z } from 'zod';

/**
 * Gerenciador de Conexão PostgreSQL com Suporte a Row Level Security (RLS)
 * Especificação: Seção 9.2 do PDF (Defesa em duas camadas)
 */

const UuidArraySchema = z.array(z.string().uuid());

export interface ClienteContexto {
  clienteIds: string[];
}

export class PostgresClientManager {
  private static instance: PostgresClientManager;
  private databaseUrl: string;
  private pool: Pool | null = null;

  private constructor() {
    this.databaseUrl = process.env.DATABASE_URL || 'postgres://dashboard_app_user:***@localhost:5432/dashboard_analytics';
  }

  public static getInstance(): PostgresClientManager {
    if (!PostgresClientManager.instance) {
      PostgresClientManager.instance = new PostgresClientManager();
    }
    return PostgresClientManager.instance;
  }

  /**
   * Constrói a instrução de segurança RLS para ser executada antes de qualquer consulta.
   * Valida estritamente cada UUID para evitar SQL injection no SET LOCAL.
   */
  public gerarComandoRLS(clienteIds: string[]): string {
    const validados = UuidArraySchema.parse(clienteIds);
    const idsFormatados = validados.join(',');
    return `SET LOCAL app.cliente_ids = '${idsFormatados}';`;
  }

  public getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: this.databaseUrl,
        max: 10,
        idleTimeoutMillis: 30000,
      });
    }
    return this.pool;
  }

  public async executarComRLS<T>(
    clienteIds: string[],
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const comandoRLS = this.gerarComandoRLS(clienteIds);
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query(comandoRLS);
      const resultado = await fn(client);
      await client.query('COMMIT');
      return resultado;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  public async testarConexao(): Promise<boolean> {
    const client = await this.getPool().connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  }

  public getDatabaseUrl(): string {
    return this.databaseUrl;
  }
}

export const pgManager = PostgresClientManager.getInstance();

