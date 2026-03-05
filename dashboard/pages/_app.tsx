import App from 'next/app';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>QueClaw Admin Dashboard</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
