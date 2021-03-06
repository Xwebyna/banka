import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../server/app';
import userModel from '../server/models/users';
import inputs from './mockdata.test';


chai.use(chaiHttp);

// Cache Token
const adminToken = userModel.generateAuthToken(
  { id: 6, type: 'staff', isadmin: false }
);
let userToken = '';

// Cache Response
let resp = '';


// debit Account API Endpoint
describe('Staff(Cashier) should be able to debit bank account', () => {
  describe('POST /api/v1/transactions/<account_number>/debit', () => {
    describe("When Staff(Cashier) wants to debit a user's bank account", () => {
      before(async () => {
        userToken = userModel.generateAuthToken(
          { id: 1, type: 'staff', isAdmin: false }
        );
        resp = await chai.request(app).post('/api/v1/accounts').set('Authorization', userToken).send({ type: 'savings' });
      });

      // Throw error 403 if unauthorized user tries to debit user bank account
      it('Send unauthorized message if user is not authorized', async () => {
        const res = await chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/debit`).set('Authorization', userToken).send({ amount: '400' });
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('error').to.deep.equal('Unauthorized');
      });

      // Respond with error 404 if account number to be debited does not exist
      it('should respond with error 404 - not found - if account number does not exist', async () => {
        const res = await chai.request(app).post('/api/v1/transactions/111111111/debit').set('Authorization', adminToken).send({ amount: '400' });
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error');
      });


      // Get an error response if token is invalid or expired - status code 401
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/debit`).set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ').send({ amount: '400' });
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      // Get 201 status code if account is successfully debited
      it('should respond with a status code 201 if account is successfully debited', (done) => {
        chai.request(app)
          .post(`/api/v1/transactions/${resp.body.data.accountnumber}/debit`)
          .set('Authorization', adminToken).send({ amount: '700' })
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.data).to.have.property('transactionId');
            expect(res.body.data).to.have.property('accountNumber');
            expect(res.body.data).to.have.property('amount');
            expect(res.body.data).to.have.property('cashier');
            expect(res.body.data).to.have.property('transactionType').to.deep.equal('debit');
            expect(res.body.data).to.have.property('acccountBalance').to.deep.equal(300);
            done();
          });
      });

      it('should respond with a status code 400 if balance is not enough for debit transaction', (done) => {
        chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/debit`)
          .set('Authorization', adminToken)
          .send({ amount: '700' })
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('error').to.deep.equal('Balance not sufficient for debit transaction');
            done();
          });
      });
    });
  });
});


// Credit Account API Endpoint Test
describe('Staff(Cashier) should be able to credit bank account', () => {
  describe('POST /api/v1/transactions/<account_number>/credit', () => {
    describe("When Staff(Cashier) wants to credit a user's bank account", () => {
      before(async () => {
        userToken = userModel.generateAuthToken(
          { id: 1, type: 'client', isAdmin: false }
        );
      });

      // Throw error 403 if unauthorized user tries to credit user bank account
      it('Send unauthorized message if user is not authorized', async () => {
        const res = await chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/credit`).set('Authorization', userToken).send({ amount: '400' });
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('error').to.deep.equal('Unauthorized');
      });

      // Respond with error 404 if account number to be credited does not exist
      it('should respond with error 404 - not found - if account number does not exist', async () => {
        const res = await chai.request(app).post('/api/v1/transactions/1234567809/credit').set('Authorization', adminToken).send({ amount: '400' });
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error');
      });


      // Get an error response if token is invalid or expired - status code 401
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/credit`).set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ').send({ amount: '400' });
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      // Get 201 status code if account is successfully credited
      it('should respond with a status code 201 if account is successfully credited', async () => {
        const res = await chai.request(app).post(`/api/v1/transactions/${resp.body.data.accountnumber}/credit`).set('Authorization', adminToken).send({ amount: '1700' });
        expect(res).to.have.status(201);
        expect(res.body.data).to.have.property('transactionId');
        expect(res.body.data).to.have.property('accountNumber');
        expect(res.body.data).to.have.property('amount');
        expect(res.body.data).to.have.property('cashier');
        expect(res.body.data).to.have.property('transactionType').to.deep.equal('credit');
        expect(res.body.data).to.have.property('acccountBalance').to.deep.equal(2000);
      });
    });
  });
});


// Password Resset Test
describe('Users should be able to reset passwpord', () => {
  describe('PATCH /api/v1/reset', () => {
    describe('When the user tries to change account password', () => {
      let user2Token;
      before(() => {
        user2Token = userModel.generateAuthToken(
          { id: 9, type: 'client', isAdmin: false }
        );
      });

      it('should throw an error 404 if user is not found', async () => {
        const res = await chai.request(app).patch('/api/v1/auth/reset').set('Authorization', user2Token).send(inputs.pswResetValid);
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error').to.deep.equal('No User Found');
      });

      it('should return an error 401 for invalid current password', async () => {
        const res = await chai.request(app).patch('/api/v1/auth/reset').set('Authorization', userToken).send(inputs.pswResetInValid);
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Password. Make sure password matches the current one');
      });

      it('should return an error 400 if confirm password does not mathc the new password', async () => {
        const res = await chai.request(app).patch('/api/v1/auth/reset').set('Authorization', userToken).send(inputs.pswResetInValid2);
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
      });


      it('should return 200 status code if password is successfully changed', (done) => {
        chai.request(app).patch('/api/v1/auth/reset').set('Authorization', userToken).send(inputs.pswResetValid)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message').to.deep.equal('Password changed successfully');
            done();
          });
      });

      it('to confrim password change, User tries log in', async () => {
        const res = await chai.request(app).post('/api/v1/auth/signin').send({
          email: 'admin@banka.com',
          password: inputs.pswResetValid.newPassword
        });
        expect(res).to.have.status(200);
        expect(res.body.data).to.have.property('token');
        expect(res.body.data).to.have.property('id');
        expect(res.body.data).to.have.property('firstname').eql(inputs.admin2SignupInputs.firstName);
        expect(res.body.data).to.have.property('lastname');
        expect(res.body.data).to.have.property('email')
      });
    });
  });
});


// View User Transactions History
describe('Users should be able to view Transactions Histrty', () => {
  describe('GET /accounts/<account-number>/transactions', () => {
    describe('When users tries to view account transaction history', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get(`/api/v1/accounts/${resp.body.data.accountnumber}/transactions`).set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should respond with 200 status code and list of transaction if successful', async () => {
        const res = await chai.request(app).get(`/api/v1/accounts/${resp.body.data.accountnumber}/transactions`).set('Authorization', userToken);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.be.an('array');
      });
    });
  });
});

// Get specific transacation by Id test
describe('Users should be able to view specific Account Transactions', () => {
  describe('GET /transactions/<id>', () => {
    describe('When users tries to view a specific account transaction', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get('/api/v1/transactions/1').set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should respond with error 404 - Not Found - id not found', async () => {
        const res = await chai.request(app).get('/api/v1/transactions/10000').set('Authorization', userToken);
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error').to.deep.equal('No transaction with the given ID');
      });


      it('should respond with 200 status code if request for specific transaction is successful', (done) => {
        chai.request(app).get('/api/v1/transactions/1').set('Authorization', userToken).end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.have.property('transactionid');
          expect(res.body.data).to.have.property('type');
          expect(res.body.data).to.have.property('newbalance');
          done();
        });
      });
    });
  });
});


// View Account Details Endpoint Test
describe('Get Route', () => {
  describe('GET /api/v1/accounts/<account-number>', () => {
    describe('When users tries to view his/her account details', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get(`/api/v1/accounts/${resp.body.data.accountnumber}`).set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should respond with error 404 - Not Found - if account does not exist', async () => {
        const res = await chai.request(app).get('/api/v1/accounts/123456789').set('Authorization', userToken);
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error').to.deep.equal('Not Found');
      });

      it('should respond with 200 status code if request for account details is successful', async () => {
        const res = await chai.request(app).get(`/api/v1/accounts/${resp.body.data.accountnumber}`).set('Authorization', userToken);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('ownerEmail');
        expect(res.body.data).to.have.property('type');
        expect(res.body.data).to.have.property('accountnumber');
        expect(res.body.data).to.have.property('balance');
      });
    });
  });
});


// Admin/Staff can View List of accounts of a specific user
describe('Get Route', () => {
  describe('GET /api/v1/user/<email-address>/accounts', () => {
    describe('Admin/Staff can view list of accounts owned by a user', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get(`/api/v1/user/${resp.body.data.email}/accounts`).set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should send unauthorized message if unathorized user tries to get list of accounts', async () => {
        const res = await chai.request(app).get(`/api/v1/user/${resp.body.data.email}/accounts`).set('Authorization', userToken);
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('error').to.deep.equal('Unauthorized');
      });

      it('should respond with 200 status code if request by the admin/staff for user account is successful', async () => {
        const res = await chai.request(app).get(`/api/v1/user/${resp.body.data.email}/accounts`).set('Authorization', adminToken);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('accounts');
        expect(res.body.accounts).to.be.an('array');
      });
    });
  });
});


// Admin/Staff can view List of all bank accounts
describe('Get Route', () => {
  describe('GET /api/v1/accounts', () => {
    describe('Admin/Staff can view list of all bank accounts ', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get('/api/v1/accounts').set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should respond with 200 status code if request by the admin/staff for all account is successful', async () => {
        const res = await chai.request(app).get('/api/v1/accounts').set('Authorization', adminToken);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.be.an('array');
      });
    });
  });
});

// Test for list of active or dormant accounts
describe('Get Route', () => {
  describe('GET /api/v1/accounts?status=active', () => {
    describe('Admin/Staff can view list of all bank accounts according to status', () => {
      it('should respond with error 401 - unauthorized - if token is invalid or expired', async () => {
        const res = await chai.request(app).get('/api/v1/accounts?status=active').set('Authorization', 'eyJhbGciOiJIUzI1NiIsIkpXVCJ9.kcvIkS9ACezPO2DgAi-XvEikLy9ZA2y0kWiQ');
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error').to.deep.equal('Invalid Token');
      });

      it('should send unauthorized message if unathorized user tries to get list of accounts', async () => {
        const res = await chai.request(app).get('/api/v1/accounts?status=active').set('Authorization', userToken);
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('error').to.deep.equal('Unauthorized');
      });

      it('should respond with 200 status code if request is successful', async () => {
        const res = await chai.request(app).get('/api/v1/accounts?status=active').set('Authorization', adminToken);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.be.an('array');
        expect(res.body.data[0]).to.have.property('status').to.deep.equal('active');
      });
    });
  });
});


describe('POST Route', () => {
  describe('POST /api/v1/createrole', () => {
    describe('Admin can create another admin user account', () => {
      it('should respond with error 403 - unauthorized - if user is not authorised', async () => {
        const res = await chai.request(app).post('/api/v1/createrole').set('Authorization', userToken).send({
          email: 'banka2@gmail.com',
          firstName: 'Markee',
          lastName: 'Dembele',
          role: '1'
        });
        expect(res).to.have.status(403);
      });

      it('should respond with status 201 when another admin is successfully created  ', async () => {
        const superAdminToken = userModel.generateAuthToken(
          { id: 6, type: 'staff', isadmin: true }
        );
        const res = await chai.request(app).post('/api/v1/createrole').set('Authorization', superAdminToken).send({
          email: 'banka2@gmail.com',
          firstName: 'Markee',
          lastName: 'Dembele',
          role: '1'
        });
        expect(res).to.have.status(201);
      });

      it('should respond with status 201 when another staff is successfully created  ', async () => {
        const superAdminToken = userModel.generateAuthToken(
          { id: 6, type: 'staff', isadmin: true }
        );
        const res = await chai.request(app).post('/api/v1/createrole').set('Authorization', superAdminToken).send({
          email: 'banka22@gmail.com',
          firstName: 'Markee',
          lastName: 'Dembele',
          role: '0'
        });
        expect(res).to.have.status(201);
      });
    });
  });
});
