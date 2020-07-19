import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}
interface ReturnDTO {
  transactions: Transaction[];
  balance: Balance;
}
@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getAllWithBalance(): Promise<ReturnDTO> {
    const transactionRepository = getRepository(Transaction);
    const allTransactions = await transactionRepository.find();

    const balance = await this.getBalance(allTransactions);

    return { transactions: allTransactions, balance };
  }

  public async getBalance(transactions?: Transaction[]): Promise<Balance> {
    const transactionRepository = getRepository(Transaction);

    const allTransactions =
      transactions || (await transactionRepository.find());

    const totalIncome: number = allTransactions.reduce((acc, curObj) => {
      if (curObj.type === 'income') {
        return acc + curObj.value;
      }
      return acc;
    }, 0);

    const totalOutcome: number = allTransactions.reduce((acc, curObj) => {
      if (curObj.type === 'outcome') {
        return acc + curObj.value;
      }
      return acc;
    }, 0);

    const total: number = totalIncome - totalOutcome;

    const balance: Balance = {
      income: totalIncome,
      outcome: totalOutcome,
      total,
    };

    return balance;
  }
}

export default TransactionsRepository;
