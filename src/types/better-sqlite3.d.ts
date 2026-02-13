declare module "better-sqlite3" {
  interface Database {
    exec(sql: string): this;
    prepare(sql: string): Statement;
    close(): this;
  }
  interface Statement {
    run(...params: unknown[]): RunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  const Database: new (filename: string) => Database;
  export = Database;
}
