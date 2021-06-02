import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box'
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import MyNFTs from './MyNFTs.js'
import AllNFTs from './AllNFTs.js'
import { Button } from '@material-ui/core/'
import DepositNft from './DepositNft.js'
import Grid from '@material-ui/core/Grid';
import BnbBalance from './BnbBalance.js'
import NftFractionsRepository from '../../contracts/bsc/NftFractionsRepository.json';
import Dex from '../../contracts/bsc/Dex.json';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

const AntTabs = withStyles({
    root: {
        borderBottom: '1px solid #e8e8e8',
    },
    indicator: {
        backgroundColor: '#1890ff',
    },
})(Tabs);

const AntTab = withStyles((theme) => ({
    root: {
        textTransform: 'none',
        minWidth: 72,
        fontWeight: theme.typography.fontWeightRegular,
        marginRight: theme.spacing(4),
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        '&:hover': {
            color: '#40a9ff',
            opacity: 1,
        },
        '&$selected': {
            color: '#1890ff',
            fontWeight: theme.typography.fontWeightMedium,
        },
        '&:focus': {
            color: '#40a9ff',
        },
    },
    selected: {},
}))((props) => <Tab disableRipple {...props} />);

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    padding: {
        padding: theme.spacing(0),
    }
}));

const BscLandingPage = ({ web3, accounts, ipfs }) => {
    const [nftDepositDialogOpen, setNftDepositDialogOpen] = useState(false);
    const [nftFractionsRepositoryContract, setNftFractionsRepositoryContract] = useState(undefined);
    const [dexContract, setDexContract] = useState(undefined);
    const [selectedNetwork, setSelectedNetwork] = useState(0);

    const classes = useStyles();
    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    useEffect(() => {
        const init = async () => {
            const networkId = await web3.eth.net.getId();
            setSelectedNetwork(networkId);
            let deployedNetwork = NftFractionsRepository.networks[networkId];
            const nftFractionsRepositoryContract = new web3.eth.Contract(
                NftFractionsRepository.abi,
                deployedNetwork && deployedNetwork.address,
            );
            deployedNetwork = Dex.networks[networkId];
            const dexContract = new web3.eth.Contract(
                Dex.abi,
                deployedNetwork && deployedNetwork.address,
            );
            setNftFractionsRepositoryContract(nftFractionsRepositoryContract);
            setDexContract(dexContract);
        }
        init();
        window.ethereum.on('chainChanged', chainId => {
            setSelectedNetwork(chainId);
            window.location.reload()
        });
        // eslint-disable-next-line
    }, []);

    const isReady = () => {
        return (
            typeof nftFractionsRepositoryContract !== 'undefined'
            && typeof dexContract !== 'undefined'
            && typeof web3 !== 'undefined'
            && typeof accounts !== 'undefined'
            && selectedNetwork === 97
        );
    }

    if (!isReady()) {
        return <div>Loading... Please, make sure the Binance Smart Chain testnet is selected in Metamask!</div>;
    }

    return (
        <>
            <Grid container>
                <Grid item md={10}>
                    <div className={classes.root}>
                        <div >
                            <AntTabs value={value} onChange={handleChange} aria-label="ant example">
                                <AntTab label="All NFTs" />
                                <AntTab label="My NFTs" />
                                <AntTab label="BNB Balance" />
                            </AntTabs>
                            <Typography className={classes.padding} />
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={2}>
                    <Box mt={1.5} ml={7}>
                        <Button
                            onClick={() => { setNftDepositDialogOpen(true) }}
                            variant="outlined"
                            type="submit">
                            Deposit NFT
                        </Button>
                    </Box>
                </Grid>
                <Grid item md={2}></Grid>
            </Grid>
            <TabPanel value={value} index={0}>
                <AllNFTs
                    web3={web3}
                    accounts={accounts}
                    nftFractionsRepositoryContract={nftFractionsRepositoryContract}
                    ipfs={ipfs} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <MyNFTs
                    web3={web3}
                    accounts={accounts}
                    nftFractionsRepositoryContract={nftFractionsRepositoryContract}
                    ipfs={ipfs} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <BnbBalance
                    accounts={accounts}
                    dexContract={dexContract} />
            </TabPanel>
            <DepositNft
                web3={web3}
                accounts={accounts}
                nftFractionsRepositoryContract={nftFractionsRepositoryContract}
                nftDepositDialogOpen={nftDepositDialogOpen}
                setNftDepositDialogOpen={setNftDepositDialogOpen} />
        </>
    )
}

export default BscLandingPage;