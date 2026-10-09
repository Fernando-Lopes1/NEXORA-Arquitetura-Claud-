export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface IDatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  initSchema(): Promise<void>;
  close(): Promise<void>;
  getProviderName(): 'PostgreSQL' | 'SQLite';
  checkConnection(): Promise<boolean>;
}
