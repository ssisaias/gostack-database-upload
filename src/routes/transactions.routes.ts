import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/uploadConfig';

const transactionsRouter = Router();
const uploadAgent = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionRepository = getCustomRepository(TransactionsRepository);
  return response.json(await transactionRepository.getAllWithBalance());
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const createTransactionService = new CreateTransactionService();

  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });
  // console.log(transaction);
  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransService = new DeleteTransactionService();
  await deleteTransService.execute(id);
  return response.sendStatus(204);
});

transactionsRouter.post(
  '/import',
  uploadAgent.single('transactions'),
  async (request, response) => {
    const importTransactionService = new ImportTransactionsService();

    const importResult = await importTransactionService.execute(request);
    /* console.log('====');
    console.log(importResult);
    console.log('===='); */

    return response.json(importResult);
  },
);

export default transactionsRouter;
