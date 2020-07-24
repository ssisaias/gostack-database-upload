/* eslint-disable no-restricted-syntax */
import { Request } from 'express-serve-static-core';
import fs from 'fs';
import csvParse from 'csv-parse';
import path from 'path';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(request: Request): Promise<Transaction[]> {
    // console.log(request.file);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const csvFilePath = path.resolve(
      __dirname,
      '..',
      '..',
      'tmp',
      request.file.filename,
    );

    // const parsedCSV = await this.loadCSV(csvFilePath);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
    // Categories that are already on the database
    const existentCategoriesTitles = existentCategories.map(
      (categorry: Category) => categorry.title,
    );

    // Categories which needs to be created
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); // Fitering duplicates in the resulting array
    /*
    * create new categories e.g.
      {
        title
      },
      {
        title
      }
    */
    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );
    // Saves in database
    await categoriesRepository.save(newCategories);
    // All categories for the import
    const finalCategories = [...newCategories, ...existentCategories];
    // Create transaction
    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionRepository.save(createdTransactions); // Save transacations

    return createdTransactions; // return imported transactions
  }
}

export default ImportTransactionsService;
