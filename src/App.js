import React, { useState, useEffect } from "react";
import Grid from '@material-ui/core/Grid';
import MenuBar from './components/MenuBar.js'
import Box from '@material-ui/core/Box';
import MaticLandingPage from './components/matic/MaticLandingPage.js';
import MaticNFTDetail from './components/matic/MaticNFTDetail.js';
import BscLandingPage from './components/bsc/BscLandingPage.js';
import BscNFTDetail from './components/bsc/BscNFTDetail.js';
import {
  HashRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { IPFS } from '../src/config/settings'
import ipfsClient from "ipfs-http-client";
import getWeb3 from "../src/util/getWeb3";

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [ipfs] = useState(ipfsClient({ host: IPFS.HOST, port: IPFS.PORT, protocol: IPFS.PROTOCOL }));

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      setWeb3(web3);
      setAccounts(accounts);
    }
    init();
    window.ethereum.on('accountsChanged', accounts => {
      setAccounts(accounts);
    });
    // eslint-disable-next-line
  }, []);

  const isReady = () => {
    return (
      typeof web3 !== 'undefined'
      && typeof accounts !== 'undefined'
    );
  }

  if (!isReady()) {
    return <div>Loading... </div>;
  }

  return (
    <Router>
      <MenuBar />
      <Grid container>
        <Grid item md={2}></Grid>
        <Grid item xs={12} md={8}>
          <Box mt={10}>
            <Switch>
              <Route path="/matic/landing" render={(props) => <MaticLandingPage {...props} web3={web3} accounts={accounts} ipfs={ipfs} />} />
              <Route path="/matic/nft/:tokenId" render={(props) => <MaticNFTDetail {...props} web3={web3} accounts={accounts} ipfs={ipfs} />} />
              <Route path="/bsc/landing" render={(props) => <BscLandingPage {...props} web3={web3} accounts={accounts} ipfs={ipfs} />} />
              <Route path="/bsc/nft/:tokenId" render={(props) => <BscNFTDetail {...props} web3={web3} accounts={accounts} ipfs={ipfs} />} />
            </Switch>
          </Box>
        </Grid>
        <Grid item md={2}></Grid>
      </Grid>
    </Router>
  );
}

export default App;
