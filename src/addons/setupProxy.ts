import { INestApplication } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { Configuration } from '&back/config/Configuration';

export const setupProxy = (app: INestApplication) => {
  const config = app.get(Configuration);

  const statisticsUrl = config.getStringOrThrow('MR_KHOMYUK_URL');

  app.use(
    '/s/statistics',
    createProxyMiddleware({
      target: `${statisticsUrl}/v1/statistics`,
      changeOrigin: true,
      pathRewrite: (path) => path.replace('/s/statistics', ''),
    }),
  );
};
