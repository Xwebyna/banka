import _ from 'lodash';
import bcrypt from 'bcrypt';
import userModel from '../models/users';

class UsersCtrl {
  static async signUp(req, res, next) {
    try {
      const data = req.body;

      const emailExist = await userModel.findEmail(data.email);
      if (emailExist) {
        return res.status(409).json({
          status: res.statusCode,
          error: 'User already registered'
        });
      }
      data.password = await bcrypt.hash(data.password, 10);
      const user = _.cloneDeep(userModel.create(data));
      user.token = userModel.generateAuthToken(user);
      return res.status(201).json({
        status: res.statusCode,
        data: _.pick(user, ['token', 'id', 'firstName', 'lastName', 'email', 'type', 'createdDate'])
      });
    } catch (err) {
      return next(err);
    }
  }

  static async logIn(req, res, next) {
    try {
      const data = req.body;

      const user = await _.cloneDeep(userModel.findEmail(data.email));
      if (!user) {
        return res.status(404).json({
          status: res.statusCode,
          error: 'No Associated Account with this Email'
        });
      }
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: res.statusCode,
          error: 'Invalid Email or Password'
        });
      }

      user.token = userModel.generateAuthToken(user);
      return res.status(200).json({
        status: res.statusCode,
        data: _.pick(user, ['token', 'id', 'firstName', 'lastName', 'email'])
      });
    } catch (err) {
      return next(err);
    }
  }

  static getUsers(req, res) {
    const users = userModel.findAll();
    return res.status(200).send(users);
  }
}

export default UsersCtrl;