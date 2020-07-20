import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    
      const foundTransaction = await transactionRepository.findOne(id);

      if (!foundTransaction) {
        throw new AppError('Transaction not found', 404);
      }
      console.log(foundTransaction);
      await transactionRepository.delete(foundTransaction.id);

  }
}

export default DeleteTransactionService;
