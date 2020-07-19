import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactionDTO): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    // Check if Category exists
    const categoryRepository = getRepository(Category);
    const categoryFound = await categoryRepository.findOne({
      where: { title: category },
    });
    let newCategory: Category = new Category();
    if (!categoryFound) {
      newCategory = categoryRepository.create({
        title: category,
      });
      newCategory = await categoryRepository.save(newCategory);
    }

    const newTransaction = transactionRepository.create({
      title,
      type,
      value,
      category: !categoryFound ? newCategory : categoryFound,
    });

    transactionRepository.save(newTransaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
