import config from 'config';
import express from 'express';
import router from './routes';
import errorHandler from './helpers/error';

// Configuration
if (!config.get('jwtPrivateKey')) {
  console.error('FATAL ERROR: jwtPrivateKey is not defined');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.status(200).json({
  status: res.statusCode,
  data: 'Welcome to Banka Default'
}));

app.use('/api/v1', router);
app.use(errorHandler);

const port = process.env.PORT || 9000;
app.listen(port, console.log('Server running...!!!'));

export default app;
