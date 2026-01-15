// accountDB.ts
import * as SQLite from 'expo-sqlite';

// Use openDatabaseSync (required by new typings)
const dbSync = SQLite.openDatabaseSync('accounts.db');

// Type cast to any to satisfy TypeScript (transaction exists at runtime)
export const db = dbSync as any;

export interface Account {
  email: string;
  contact: string;
  password: string;
}

// Initialize accounts table
export const initDB = () => {
  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS accounts (
        email TEXT PRIMARY KEY,
        contact TEXT,
        password TEXT
      );`
    );
  });
};

// Add a new account
export const addAccount = (account: Account): Promise<void> =>
  new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `INSERT INTO accounts (email, contact, password) VALUES (?, ?, ?)`,
        [account.email, account.contact, account.password],
        () => resolve(),
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });

// Find an account by email
export const findAccount = (email: string): Promise<Account | null> =>
  new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM accounts WHERE email = ?`,
        [email],
        (_: any, result: any) => {
          if (result.rows.length > 0) resolve(result.rows.item(0));
          else resolve(null);
        },
        (_: any, err: any) => {
          reject(err);
          return false;
        }
      );
    });
  });

// Verify login credentials
export const verifyLogin = async (email: string, password: string): Promise<boolean> => {
  const account = await findAccount(email);
  return account?.password === password;
};
