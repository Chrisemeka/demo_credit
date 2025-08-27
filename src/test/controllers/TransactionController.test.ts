jest.mock('../../config/database', () => {
  const createMockTransaction = () => {
    const mockTrx: any = jest.fn((tableName: string) => ({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
      insert: jest.fn().mockResolvedValue([1]),
      select: jest.fn().mockResolvedValue([]),
      first: jest.fn().mockResolvedValue(null),
    }));
    
    mockTrx.commit = jest.fn().mockResolvedValue(undefined);
    mockTrx.rollback = jest.fn().mockResolvedValue(undefined);
    
    return mockTrx;
  };

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    transaction: jest.fn(() => createMockTransaction()),
  };
  
  return {
    __esModule: true,
    default: mockDb
  };
});

import { Request, Response } from 'express';
import { TransactionController } from '../../controllers/TransactionController';
import { WalletModel } from '../../models/walletModel';
import db from '../../config/database';

jest.mock('../../models/walletModel');

const mockedWalletModel = jest.mocked(WalletModel);
const mockedDb = jest.mocked(db);

interface AuthRequest extends Request {
  user?: { user_id: number };
}

describe('TransactionController', () => {
  let mockedRequest: Partial<AuthRequest>;
  let mockedResponse: Partial<Response>;
  let mockTransaction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockedRequest = {
      user: { user_id: 1 }
    };
    mockedResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    
    const mockTrx: any = jest.fn((tableName: string) => ({
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1),
      insert: jest.fn().mockResolvedValue([1]),
    }));
    mockTrx.commit = mockTransaction.commit;
    mockTrx.rollback = mockTransaction.rollback;
    
    (mockedDb.transaction as jest.Mock).mockResolvedValue(mockTrx);
  });

  describe('deposit', () => {
    beforeEach(() => {
      mockedRequest.body = {
        account_number: 1234567890,
        amount: 1000
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully deposit funds', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Deposit successful',
          new_balance: 6000
        });
        expect(mockTransaction.commit).toHaveBeenCalled();
      });

      it('should handle deposit to wallet with zero balance', async () => {
        mockedRequest.body.amount = 500;
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Deposit successful',
          new_balance: 500
        });
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if required fields are missing', async () => {
        mockedRequest.body = { account_number: 1234567890 }; 

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields'
        });
      });

      it('should return 400 if account number is missing', async () => {
        mockedRequest.body = { amount: 1000 };

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });

      it('should return 400 if account is not found', async () => {
        mockedWalletModel.findByAccountNumber.mockResolvedValue(undefined);

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account not found'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if account is not active', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'frozen'
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet as any);

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account is not active'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if amount is negative', async () => {
        mockedRequest.body.amount = -100;
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Amount must be greater than zero'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if amount is zero', async () => {
        mockedRequest.body = {
          account_number: 1234567890,
          amount: 0.0 
        };
        
        await TransactionController.deposit(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields'  
        });
       
      });
    });
  });

  describe('withdraw', () => {
    beforeEach(() => {
      mockedRequest.body = {
        account_number: 1234567890,
        amount: 1000
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully withdraw funds', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Withdrawal successful',
          new_balance: 4000
        });
        expect(mockTransaction.commit).toHaveBeenCalled();
      });

      it('should handle withdrawal leaving zero balance', async () => {
        mockedRequest.body.amount = 5000;
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Withdrawal successful',
          new_balance: 0
        });
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if insufficient balance', async () => {
        mockedRequest.body.amount = 10000;
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Insufficient balance'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if trying to withdraw from empty account', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Insufficient balance'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if withdrawal amount exceeds balance by small margin', async () => {
        mockedRequest.body.amount = 1000.01;
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockResolvedValue(mockWallet);

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Insufficient balance'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if required fields are missing', async () => {
        mockedRequest.body = { account_number: 1234567890 };

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await TransactionController.withdraw(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });
    });
  });

  describe('transfer', () => {
    beforeEach(() => {
      mockedRequest.body = {
        sender_account: 1234567890,
        receiver_account: 9876543210,
        amount: 1000
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully transfer funds between accounts', async () => {
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        const receiverWallet = {
          id: 2,
          user_id: 2,
          account_number: 9876543210,
          balance: 2000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber
          .mockResolvedValueOnce(senderWallet)
          .mockResolvedValueOnce(receiverWallet);

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Transfer successful',
          sender_new_balance: 4000,
          receiver_new_balance: 3000
        });
        expect(mockTransaction.commit).toHaveBeenCalled();
      });

      it('should handle transfer that leaves sender with zero balance', async () => {
        mockedRequest.body.amount = 5000; 
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        const receiverWallet = {
          id: 2,
          user_id: 2,
          account_number: 9876543210,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber
          .mockResolvedValueOnce(senderWallet)
          .mockResolvedValueOnce(receiverWallet);

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Transfer successful',
          sender_new_balance: 0,
          receiver_new_balance: 5000
        });
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if trying to transfer to same account', async () => {
        mockedRequest.body = {
          sender_account: 1234567890,
          receiver_account: 1234567890, 
          amount: 1000
        };

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Cannot transfer to the same account'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if sender account not found', async () => {
        mockedWalletModel.findByAccountNumber
          .mockResolvedValueOnce(undefined) 
          .mockResolvedValueOnce({} as any);

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account not found'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if receiver account not found', async () => {
        mockedWalletModel.findByAccountNumber.mockReset();
        
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findByAccountNumber.mockImplementation((accountNumber: number) => {
          if (accountNumber === 1234567890) {
            return Promise.resolve(senderWallet);
          } else if (accountNumber === 9876543210) {
            return Promise.resolve(undefined);
          }
          return Promise.resolve(undefined);
        });

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account not found'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if sender has insufficient balance', async () => {
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 500, 
          currency: 'NGN',
          status: 'active' as const
        };

        const receiverWallet = {
          id: 2,
          user_id: 2,
          account_number: 9876543210,
          balance: 2000,
          currency: 'NGN',
          status: 'active' as const
        };

        let callCount = 0;
        mockedWalletModel.findByAccountNumber.mockImplementation((accountNumber) => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(senderWallet);
          } else if (callCount === 2) {
            return Promise.resolve(receiverWallet);
          }
          return Promise.resolve(undefined);
        });

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Insufficient balance'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if sender account is not active', async () => {
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'frozen' 
        };

        let callCount = 0;
        mockedWalletModel.findByAccountNumber.mockImplementation((accountNumber) => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(senderWallet as any);
          }
          return Promise.resolve(undefined);
        });

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account is not active'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if receiver account is not active', async () => {
        const senderWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active'as const
        };

        const receiverWallet = {
          id: 2,
          user_id: 2,
          account_number: 9876543210,
          balance: 2000,
          currency: 'NGN',
          status: 'closed' 
        };

        mockedWalletModel.findByAccountNumber
          .mockResolvedValueOnce(senderWallet)
          .mockResolvedValueOnce(receiverWallet as any);

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Account is not active'
        });
        expect(mockTransaction.rollback).toHaveBeenCalled();
      });

      it('should return 400 if required fields are missing', async () => {
        mockedRequest.body = {
          sender_account: 1234567890,
          receiver_account: 9876543210
        };

        await TransactionController.transfer(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Missing required fields'
        });
      });
    });
  });

  describe('getBalance', () => {
    beforeEach(() => {
      mockedRequest = {
        user: { user_id: 1 },
        params: { id: '1' }
      };
    });

    describe('Positive Scenarios', () => {
      it('should successfully get wallet balance', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'active'
        });
      });

      it('should get balance for wallet with zero balance', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          account_number: 1234567890,
          balance: 0,
          currency: 'NGN',
          status: 'active'
        });
      });

      it('should get balance for different currencies', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 1500.75,
          currency: 'USD',
          status: 'active' as const
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet);

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(200);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          account_number: 1234567890,
          balance: 1500.75,
          currency: 'USD',
          status: 'active'
        });
      });
    });

    describe('Negative Scenarios', () => {
      it('should return 400 if wallet ID is missing', async () => {
        mockedRequest.params = {};

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(400);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          error: 'Wallet ID is required'
        });
      });

      it('should return 401 if user is not authenticated', async () => {
        mockedRequest.user = undefined;

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(401);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Authentication required'
        });
      });

      it('should return 404 if wallet is not found', async () => {
        mockedWalletModel.findById.mockResolvedValue(undefined);

        await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

        expect(mockedResponse.status).toHaveBeenCalledWith(404);
        expect(mockedResponse.json).toHaveBeenCalledWith({
          message: 'Wallet not found'
        });
      });

      it('should return 403 if wallet is not active', async () => {
        const mockWallet = {
          id: 1,
          user_id: 1,
          account_number: 1234567890,
          balance: 5000,
          currency: 'NGN',
          status: 'frozen'
        };

        mockedWalletModel.findById.mockResolvedValue(mockWallet as any);

       await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

       expect(mockedResponse.status).toHaveBeenCalledWith(403);
       expect(mockedResponse.json).toHaveBeenCalledWith({
         message: 'Forbidden: Wallet is not active'
       });
     });

     it('should return 403 if user tries to access another users wallet', async () => {
       const mockWallet = {
         id: 1,
         user_id: 2,
         account_number: 1234567890,
         balance: 5000,
         currency: 'NGN',
         status: 'active' as const
       };

       mockedWalletModel.findById.mockResolvedValue(mockWallet);

       await TransactionController.getBalance(mockedRequest as AuthRequest, mockedResponse as Response);

       expect(mockedResponse.status).toHaveBeenCalledWith(403);
       expect(mockedResponse.json).toHaveBeenCalledWith({
         message: 'Forbidden: You can only get the balance of your own wallet'
       });
     });
   });
 });
});