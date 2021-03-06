import express from 'express';
import userController from '../controllers/userController';
import accountController from '../controllers/accountController';
import validate from '../helpers/validateUser';
import verifyAuthToken from '../helpers/verifyAuthToken';
import authorize from '../helpers/authorization';
import transaction from '../controllers/transactionController';

const router = express.Router();

// Landing API Endpoint
router.get('/', (req, res) => res.status(200).json({
  status: res.statusCode,
  message: 'Welcome to the Banka App Entry Point'
}));


// Users Route
router.post('/auth/signup', validate.signUp, userController.signUp);
router.post('/auth/signin', validate.logIn, userController.logIn);
router.post('/accounts', validate.accountReg, verifyAuthToken, accountController.create);
router.get('/myaccounts', verifyAuthToken, accountController.getMyAccounts);


// Admin/Staff
router.get('/user/:email/accounts', verifyAuthToken, authorize.staff, accountController.getUserAccounts);
router.get('/accounts', verifyAuthToken, authorize.staff, accountController.getAllAccounts);
router.route('/account/:accountNumber')
  .delete(verifyAuthToken, authorize.staff, accountController.deleteAccount)
  .patch(validate.updateStatus, verifyAuthToken, authorize.staff, accountController.updateStatus);


// Only Cashier
router.post('/transactions/:accountNumber/debit', validate.updateAccount, verifyAuthToken, authorize.cashier, transaction.debit);
router.post('/transactions/:accountNumber/credit', validate.updateAccount, verifyAuthToken, authorize.cashier, transaction.credit);

// All Roles
router.patch('/auth/reset', validate.updatePassword, verifyAuthToken, userController.resetPassword);
router.get('/accounts/:accountNumber/transactions', verifyAuthToken, transaction.getUserTransactions);
router.get('/transactions/:transactionId', verifyAuthToken, transaction.getSingleTransaction);
router.get('/accounts/:accountNumber', verifyAuthToken, accountController.getAccountDetails);

// Only Admin
router.post('/createrole', validate.createAdminStaff, verifyAuthToken, authorize.admin, userController.createAdminUser);

export default router;
