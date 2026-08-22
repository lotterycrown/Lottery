import { createApp } from './app';
import { env } from './config';

const app = createApp();

app.listen(env.API_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${env.API_PORT}`);
});
