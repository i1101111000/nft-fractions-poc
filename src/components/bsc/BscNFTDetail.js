import React, { useEffect, useState } from 'react'
import { withRouter } from "react-router";
import NFTCard from './NFTCard.js'
import { BufferList } from "bl";
import ERC721 from '../../contracts/bsc/ERC721.json';
import TokenOwners from './TokenOwners.js';
import Grid from '@material-ui/core/Grid';
import NFTDescription from './NFTDescription.js'
import Box from '@material-ui/core/Box';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import BuyOrders from './BuyOrders.js';
import SellOrders from './SellOrders.js';
import { Button } from '@material-ui/core/';
import PlaceBuyOrder from './PlaceBuyOrder.js';
import PlaceSellOrder from './PlaceSellOrder.js';
import TokenTransferApprovalDialog from './TokenTransferApprovalDialog.js';
import NftFractionsRepository from '../../contracts/bsc/NftFractionsRepository.json';
import Dex from '../../contracts/bsc/Dex.json';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
    table: {
        minWidth: 450,
    },
}));

const BscNFTDetail = ({ match, web3, accounts, ipfs }) => {
    const { params: { tokenId } } = match;
    const classes = useStyles();

    const [nftFractionsRepositoryContract, setNftFractionsRepositoryContract] = useState(undefined);
    const [dexContract, setDexContract] = useState(undefined);
    const [metaData, setMetadata] = useState(undefined);
    const [owners, setOwners] = useState([]);
    const [totalShares, setTotalShares] = useState(0);
    const [myShares, setMyShares] = useState(0);
    const [originalContract, setOriginalContract] = useState("");
    const [originalTokenId, setOriginalTokenId] = useState("");
    const [buyOrders, setBuyOrders] = useState([]);
    const [sellOrders, setSellOrders] = useState([]);
    const [placeBuyOrderDialogOpen, setPlaceBuyOrderDialogOpen] = useState(false);
    const [placeSellOrderDialogOpen, setPlaceSellOrderDialogOpen] = useState(false);
    const [bnbBalance, setBnbBalance] = useState(0);
    const [bnbReservedBalance, setBnbReservedBalance] = useState(0);
    const [sellOrderAvailable, setSellOrderAvailable] = useState(false);
    const [buyOrderAvailable, setBuyOrderAvailable] = useState(false);
    const [sharesAvailableForSelling, setSharesAvailableForSelling] = useState(0);
    const [tokenTransferDialogOpen, setTokenTransferDialogOpen] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState(0);

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

            const tokenData = await nftFractionsRepositoryContract.methods.getTokenData(tokenId).call();
            const erc721 = new web3.eth.Contract(ERC721.abi, tokenData.erc721ContractAddress);
            const tokenURI = await erc721.methods.tokenURI(tokenData.erc721TokenId).call();
            let nftMetadataFromIPFS = { name: 'name' };
            for await (const file of ipfs.get(tokenURI)) {
                const content = new BufferList()
                for await (const chunk of file.content) {
                    content.append(chunk)
                }
                nftMetadataFromIPFS = JSON.parse(content.toString());
            }
            nftMetadataFromIPFS.tokenId = tokenId;
            setMetadata(nftMetadataFromIPFS);
            setTotalShares(tokenData.totalFractionsAmount);
            const mySharesFromChain = await nftFractionsRepositoryContract.methods.balanceOf(accounts[0], tokenId).call();
            setMyShares(mySharesFromChain);
            setOriginalContract(tokenData.erc721ContractAddress);
            setOriginalTokenId(tokenData.erc721TokenId);
            const ownersFromChain = await nftFractionsRepositoryContract.methods.getOwnersBYtokenId(tokenId).call();
            let ownersData = [];
            let acctualAccountsShares;
            for (let owner of ownersFromChain) {
                const ownerShares = await nftFractionsRepositoryContract.methods.balanceOf(owner, tokenId).call();
                let ownerData = {
                    "owner": owner,
                    "shares": ownerShares
                }
                ownersData.push(ownerData);
                if (owner === accounts[0]) {
                    acctualAccountsShares = ownerShares;
                }
            }
            let sharesReservedInOrders = await dexContract.methods.getSharesReserveBalance(accounts[0], tokenId).call();
            setSharesAvailableForSelling(acctualAccountsShares - sharesReservedInOrders);
            setOwners(ownersData);
            const buyOrdersFromChain = await dexContract.methods.getOrders(tokenId, 0).call();
            const buyOrdersExtended = buyOrdersFromChain.map((item) => ({
                ...item,
                ethPrice: web3.utils.fromWei(item.price, 'ether')
            }));
            setBuyOrders(buyOrdersExtended);
            const sellOrdersFromChain = await dexContract.methods.getOrders(tokenId, 1).call();
            const sellOrdersExtended = sellOrdersFromChain.map((item) => ({
                ...item,
                ethPrice: web3.utils.fromWei(item.price, 'ether')
            }));
            setBuyOrderAvailable(buyOrdersExtended.length > 0);
            setSellOrders(sellOrdersExtended);
            let bnbBalanceFromChain = await dexContract.methods.getEthBalance(accounts[0]).call();
            bnbBalanceFromChain = web3.utils.fromWei(bnbBalanceFromChain, 'ether');
            setSellOrderAvailable(sellOrdersExtended.length > 0);
            setBnbBalance(bnbBalanceFromChain);
            let bnbReservedBalanceFromChain = await dexContract.methods.getEthReserveBalance(accounts[0]).call();
            bnbReservedBalanceFromChain = web3.utils.fromWei(bnbReservedBalanceFromChain, 'ether');
            setBnbReservedBalance(bnbReservedBalanceFromChain);
        }
        init();
        // eslint-disable-next-line
    }, []);

    const isReady = () => {
        return (
            typeof nftFractionsRepositoryContract !== 'undefined'
            && typeof metaData !== 'undefined'
            && typeof dexContract !== 'undefined'
            && typeof web3 !== 'undefined'
            && typeof accounts !== 'undefined'
            && selectedNetwork === 97
        );
    }

    if (!isReady()) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Box mt={15}>
                <Grid container>
                    <Grid item md={6}>
                        <NFTCard image={metaData.image} />
                    </Grid>
                    <Grid item md={1}></Grid>
                    <Grid item md={5}>
                        <NFTDescription
                            accounts={accounts}
                            nftFractionsRepositoryContract={nftFractionsRepositoryContract}
                            tokenId={tokenId}
                            name={metaData.name}
                            description={metaData.description}
                            author={metaData.author}
                            ownShares={myShares}
                            totalShares={totalShares} />
                        <div className={classes.root}>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1a-content"
                                    id="panel1a-header"
                                >
                                    <Typography className={classes.heading}>Owners</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TokenOwners owners={owners} />
                                </AccordionDetails>
                            </Accordion>
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel2a-content"
                                    id="panel2a-header"
                                >
                                    <Typography className={classes.heading}>Original contract</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <TableContainer className={classes.table} component={Paper}>
                                        <Table aria-label="simple table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Contract</TableCell>
                                                    <TableCell>TokenId</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow key={originalContract}>
                                                    <TableCell>{originalContract}</TableCell>
                                                    <TableCell>{originalTokenId}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </AccordionDetails>
                            </Accordion>
                        </div>
                    </Grid>
                </Grid>
                <Box mt={10}>
                    <Grid container>
                        <Grid item md={5}>
                            <Box mb={3}>
                                <Typography className={classes.heading}>Buy Orders</Typography>
                            </Box>
                            <BuyOrders orders={buyOrders} accounts={accounts} dexContract={dexContract} />
                            <Button
                                onClick={() => { setPlaceBuyOrderDialogOpen(true) }}
                                variant="outlined"
                                type="submit">
                                Place Order
                            </Button>
                        </Grid>
                        <Grid item md={2}></Grid>
                        <Grid item md={5}>
                            <Box mb={3}>
                                <Typography className={classes.heading}>Sell Orders</Typography>
                            </Box>
                            <SellOrders orders={sellOrders} accounts={accounts} dexContract={dexContract} />
                            <Button
                                onClick={() => { setPlaceSellOrderDialogOpen(true) }}
                                variant="outlined"
                                type="submit">
                                Place Order
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Box >
            <PlaceBuyOrder
                web3={web3}
                bnbBalance={bnbBalance}
                bnbReservedBalance={bnbReservedBalance}
                tokenId={tokenId}
                accounts={accounts}
                dexContract={dexContract}
                placeBuyOrderDialogOpen={placeBuyOrderDialogOpen}
                setPlaceBuyOrderDialogOpen={setPlaceBuyOrderDialogOpen}
                sellOrderAvailable={sellOrderAvailable} />
            <PlaceSellOrder
                web3={web3}
                tokenId={tokenId}
                accounts={accounts}
                dexContract={dexContract}
                placeSellOrderDialogOpen={placeSellOrderDialogOpen}
                setPlaceSellOrderDialogOpen={setPlaceSellOrderDialogOpen}
                buyOrderAvailable={buyOrderAvailable}
                sharesAvailableForSelling={sharesAvailableForSelling}
                setTokenTransferDialogOpen={setTokenTransferDialogOpen} />
            <TokenTransferApprovalDialog
                open={tokenTransferDialogOpen}
                nftFractionsRepositoryContract={nftFractionsRepositoryContract}
                accounts={accounts}
                setTokenTransferDialogOpen={setTokenTransferDialogOpen}
                dexContractAddress={dexContract._address} />
        </>
    );
}

export default withRouter(BscNFTDetail);